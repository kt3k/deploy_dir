⚠️ This project is now deprecated.

Deno Deploy now supports [static files](https://deno.com/blog/deploy-static-files). You can retreive static files in your repository by using Deno FS APIs such as `Deno.readFile`, `Deno.readDir`, etc. There is no need of using this tool to host static files in Deno Deploy.

# deploy_dir v0.3.2

[![ci](https://github.com/kt3k/deploy_dir/actions/workflows/ci.yml/badge.svg)](https://github.com/kt3k/deploy_dir/actions/workflows/ci.yml)

`deploy_dir` is a CLI tool for hosting static web sites in
[Deno Deploy](https://deno.com/deploy).

`deploy_dir` reads the contents of a directory and package them as source code
for Deno Deploy.

Note: This tool is not suitable for hosting large static contents like videos,
audios, high-res images, etc.

# Install

Deno >= 1.10 is recommended.

```
deno install -f --allow-read=. --allow-write=. https://deno.land/x/deploy_dir@v0.3.2/cli.ts
```

# Usage

The basic usage of the CLI is:

```
deploy_dir dist -o deploy.js
```

This command reads the files under `./dist/` directory and writes the source
code for [Deno Deploy](https://deno.com/deploy) to `./deploy.js`

You can check the behavior of this deployment by using
[deployctl](https://deno.land/x/deploy) command:

```
deployctl run deploy.js
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
  --ts                        Output source code as TypeScript. Default is false.
  --basic-auth <id:pw>        Performs basic authentication in the deployed site. The credentials are in the form of <user>:<password>
  --cache                     Specifies the cache control header for specific file paths.
                              e.g. --cache "/css:max-age=3600,/img:max-age=86400"
  -y, --yes                   Answers yes when the tool ask for overwriting the output.
  -v, --version               Shows the version number.
  -h, --help                  Shows the help message.

Example:
  deploy_dir dist/ -o deploy.js
                              Reads the files under dist/ directory and outputs 'deploy.js' file which
                              serves the contents under dist/ as deno deploy worker.
```

# Internals

The output source typically looks like the below:

```ts
// This script is generated by https://deno.land/x/deploy_dir@v0.1.6
import { decode } from "https://deno.land/std@0.97.0/encoding/base64.ts";
import { gunzip } from "https://raw.githubusercontent.com/kt3k/compress/bbe0a818d2acd399350b30036ff8772354b1c2df/gzip/gzip.ts";
console.log("init");
const dirData: Record<string, [Uint8Array, string]> = {};
dirData["/bar.ts"] = [
  decode("H4sIAAAAAAAAA0vOzyvOz0nVy8lP11BKSixS0rTmAgCz8kN9FAAAAA=="),
  "text/typescript",
];
dirData["/foo.txt"] = [
  decode("H4sIAAAAAAAAA0vLz+cCAKhlMn4EAAAA"),
  "text/plain",
];
dirData["/index.html"] = [
  decode("H4sIAAAAAAAAA/NIzcnJV+QCAJ7YQrAHAAAA"),
  "text/html",
];
addEventListener("fetch", (e) => {
  let { pathname } = new URL(e.request.url);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  let data = dirData[pathname];
  if (!data) {
    data = dirData[pathname + ".html"];
  }
  if (data) {
    const [bytes, mediaType] = data;
    const acceptsGzip = e.request.headers.get("accept-encoding")?.split(
      /[,;]s*/,
    ).includes("gzip");
    if (acceptsGzip) {
      e.respondWith(
        new Response(bytes, {
          headers: {
            "content-type": mediaType,
            "content-encoding": "gzip",
          },
        }),
      );
    } else {
      e.respondWith(
        new Response(gunzip(bytes), { headers: { "content-type": mediaType } }),
      );
    }
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
```

You can extend this deploy source code by removing the last line
`e.respondWith(new Response("404 Not Found", { status: 404 }));` and replace it
with your own handler.

# Limitation

If your generated script exceeds 5MB, your deployment will become very unstable.
This is because Deno Deploy has
[256MB memory limit](https://deno.com/deploy/docs/pricing-and-limits). In that
case, we recommend using
[proxying technique](https://deno.com/deploy/docs/serve-static-assets) for
serving static web site.

# History

- 2021-06-17 v0.3.2 Add --cache option.
- 2021-06-17 v0.3.1 The output defaults to JavaScript. Add `--ts` option.
- 2021-06-17 v0.3.0 Add Etag Support.

# License

MIT
