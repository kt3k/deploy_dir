import { parse } from "https://deno.land/std@0.97.0/flags/mod.ts";
import { red } from "https://deno.land/std@0.97.0/fmt/colors.ts";
import { readDirCreateSource } from "./mod.ts";
import { parseCacheOption } from "./util.ts";

const NAME = "deploy_dir";
const VERSION = "0.3.2";

function usage() {
  console.log(`
Usage: ${NAME} <dir> [-h][-v][-o <filename>][--ts][-r <path>]

Read the files under the given directory and outputs the source code for Deno Deploy
which serves the contents of the given directory.

Options:
  -r, --root <path>           Specifies the root path of the deployed static files. Default is '/'.
  -o, --output <filename>     Specifies the output filename. If not specified, the tool shows the source code to stdout.
  --ts                        Output source code as TypeScript. Default is false.
  --basic-auth <id:pw>        Performs basic authentication in the deployed site. The credentials are in the form of <user>:<password>
  --cache                     Specifies the cache control header for specific file paths.
                              e.g. --cache "/css:max-age=3600,/img:max-age=86400"
  -y, --yes                   Answers yes when the tool ask for overwriting the output.
  -v, --version               Shows the version number.
  -h, --help                  Shows the help message.

Example:
  deploy_dir dist/ -o deploy.ts
                              Reads the files under dist/ directory and outputs 'deploy.ts' file which
                              serves the contents under dist/ as deno deploy worker.
`.trim());
}

type CliArgs = {
  _: string[];
  version: boolean;
  help: boolean;
  cache: string;
  root: string;
  output: string;
  ts: boolean;
  "basic-auth": string;
  yes: boolean;
};

export async function main(cliArgs: string[]) {
  const {
    version,
    help,
    cache,
    root = "/",
    output,
    ts,
    "basic-auth": basicAuth,
    yes,
    _: args,
  } = parse(cliArgs, {
    boolean: ["help", "version", "ts", "yes"],
    string: ["cache", "root", "output", "basic-auth"],
    alias: {
      h: "help",
      v: "version",
      o: "output",
      r: "root",
      y: "yes",
    },
  }) as CliArgs;

  if (help) {
    usage();
    return 0;
  }

  if (version) {
    console.log(`${NAME}@${VERSION}`);
    return 0;
  }

  const [dir] = args;

  if (!dir) {
    console.log(red("Error: target directory is not given"));
    usage();
    return 1;
  }

  const cacheRecord = cache ? parseCacheOption(cache) : undefined;

  const source = await readDirCreateSource(dir, root, {
    cache: cacheRecord,
    toJavaScript: !ts,
    basicAuth,
  });
  if (!output) {
    console.log(source);
    return 0;
  }
  try {
    const stat = await Deno.lstat(output);
    if (stat.isDirectory) {
      console.log(red(`Error: the output path ${output} is directory`));
      return 1;
    }
    if (
      yes || confirm(
        `The output path ${output} already exists. Are you sure to write this file?`,
      )
    ) {
      await performSourceCodeWrite(output, source);
      return 0;
    } else {
      console.log("Aborting");
      return 1;
    }
  } catch (e) {
    if (e.name === "NotFound") {
      await performSourceCodeWrite(output, source);
      return 0;
    }
    throw e;
  }
}

async function performSourceCodeWrite(output: string, source: string) {
  console.log(`Writing the source code to '${output}'`);
  await Deno.writeTextFile(output, source);
  console.log(`Done`);
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args));
}
