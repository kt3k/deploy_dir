# deploy_dir v0.1.6

[![ci](https://github.com/kt3k/deploy_dir/actions/workflows/ci.yml/badge.svg)](https://github.com/kt3k/deploy_dir/actions/workflows/ci.yml)

`deploy_dir` is a CLI tool for hosting static web sites in
[Deno Deploy](https://deno.com/deploy).

`deploy_dir` reads the contents of a directory and package them as source code
for Deno Deploy or CloudFlare workers.

Note: This tool is not suitable for hosting large static contents like videos,
audios, high-res images, etc.

Bonus: This tool also works for
[CloudFlare Workers](https://workers.cloudflare.com/) if you pass `--js` option.

# Install

Deno >= 1.10 is recommended.

```
deno install -qf --allow-read=. --allow-write=. https://deno.land/x/deploy_dir@v0.1.6/cli.ts
```

# Usage

The basic usage of the CLI is:

```
deploy_dir dist -o deploy.ts
```

This command reads the files under `./dist/` directory and writes the source
code for [Deno Deploy](https://deno.com/deploy) to `./deploy.ts`

You can check the behavior of this deployment by using
[deployctl](https://deno.land/x/deploy) command:

```
deployctl run deploy.ts
```

This serves the contents of the source directory such as
http://localhost:8080/foo.txt , http://localhost:8080/bar.ts , etc (Note: The
directory index path maps to `dir/index.html` automatically)

# CLI usage

`deploy_dir` supports the following options:

```
Usage: deploy_dir <dir> [-h][-v][-o <filename>][--js][-r <path>]

Read the files under the given directory and outputs the source code for Deno Deploy
which serves the contents of the given directory.

Options:
  -r, --root <path>           Specifies the root path of the deployed static files. Default is '/'.
  -o, --output <filename>     Specifies the output filename. If not specified, the tool shows the source code to stdout.
  --js                        Output source code as plain JavaScript. Default is false. Set this true if you want to deploy to CloudFlare Workers.
  -y, --yes                   Answers yes when the tool ask for overwriting the output.
  -v, --version               Shows the version number.
  -h, --help                  Shows the help message.

Example:
  deploy_dir dist/ -o deploy.ts
                              Reads the files under dist/ directory and outputs 'deploy.ts' file which
                              serves the contents under dist/ as deno deploy worker.
```

# Internals

The output source typically looks like the below:

```ts
const dirData: Record<string, Uint8Array> = {};
dirData["/bar.ts"] = [
  Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0)),
  "text/typescript",
];
dirData["/foo.txt"] = [
  Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0)),
  "text/plain",
];
addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  const data = dirData[pathname];
  if (data) {
    const [bytes, mediaType] = data;
    e.respondWith(
      new Response(bytes, { headers: { "content-type": mediaType } }),
    );
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
```

You can extend this deploy source code by removing the last line
`e.respondWith(new Response("404 Not Found", { status: 404 }));` and replace it
with your own handler.

# License

MIT
