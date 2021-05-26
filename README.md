# deploy_dir v0.0.1

Read the files under the given directory and outputs the source code for Deno
Deploy which respond with the contents of the given directory.

# Install

Deno >= 1.10 is recommended.

```
deno install -qf --allow-read=. --allow-write=. https://deno.land/x/deploy_dir@v0.0.1/cli.ts
```

# Usage

The basic usage of the CLI is:

```
deploy_dir dist -o deploy.ts
```

This command reads the files under `./dist/` directory and writes the source
code for [Deno Deploy](https://deno.com/deploy) to `./deploy.ts`

The output source code typically looks like the below:

```ts
const dirData: Record<string, Uint8Array> = {};
dirData["/bar.ts"] = Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0));
dirData["/foo.txt"] = Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0));
addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  const data = dirData[pathname];
  if (data) {
    e.respondWith(new Response(data));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
```

You can check the behavior of this deployment by using [deployctl]() command locally:

```
deployctl run deploy.ts
```

This serves the contents of the source directory such as http://localhost:8080/foo.txt and http://localhost:8080/bar.ts

# CLI usage

`deploy_dir` supports the following options:

```
Usage: deploy_dir <dir> [-h][-v][-o <filename>][-r <path>]

Read the files under the given directory and outputs the source code for Deno Deploy
which serves the contents of the given directory.

Options:
  -o, --output <filename>     Specifies the output filename. Default is 'deploy.ts'.
  -r, --root <path>           Specifies the root path of the deployed static files. Default is '/'.
  -y, --yes                   Answers yes when the tool ask for overwriting the output.
  -v, --version               Shows the version number.
  -h, --help                  Shows the help message.
```

# License

MIT
