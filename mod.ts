import { walk } from "https://deno.land/std@0.97.0/fs/walk.ts";
import { encode } from "https://deno.land/std@0.97.0/encoding/base64.ts";
import { join, relative } from "https://deno.land/std@0.97.0/path/mod.ts";
import { gzip } from "https://deno.land/x/compress@v0.3.8/gzip/gzip.ts";

/**
 * Reads the contents of the given directory and creates the source code for Deno Deploy,
 * which serves the files in that directory
 */
export async function readDirCreateSource(
  dir: string,
  root = "/",
  opts: {
    toJavaScript?: boolean;
    basicAuth?: string;
    gzipTimestamp?: number;
  } = {},
): Promise<string> {
  const buf: string[] = [];
  if (!root.startsWith("/")) {
    root = "/" + root;
  }
  buf.push(
    "// This script is generated by https://deno.land/x/deploy_dir@v0.2.2",
  );
  if (opts.basicAuth) {
    buf.push(
      'import { basicAuth } from "https://deno.land/x/basic_auth@v1.0.0/mod.ts";',
    );
  }
  buf.push(
    'import { decode } from "https://deno.land/std@0.97.0/encoding/base64.ts";',
    'import { gunzip } from "https://raw.githubusercontent.com/kt3k/compress/bbe0a818d2acd399350b30036ff8772354b1c2df/gzip/gzip.ts";',
  );
  buf.push('console.log("init");');
  if (opts?.toJavaScript) {
    buf.push("const dirData = {};");
  } else {
    buf.push("const dirData: Record<string, [Uint8Array, string]> = {};");
  }
  const items: [string, string, string][] = [];
  for await (const { path } of walk(dir)) {
    const stat = await Deno.lstat(path);
    if (stat.isDirectory) {
      continue;
    }
    const name = join(root, relative(dir, path));
    const type = getMediaType(name);
    const contents = await Deno.readFile(path);
    const base64 = encode(gzip(contents, { timestamp: opts.gzipTimestamp || 0 }));
    items.push([name, base64, type]);
  }
  items.sort(([name0], [name1]) => {
    if (name0 < name1) {
      return -1;
    } else if (name0 > name1) {
      return 1;
    }
    return 0;
  });
  for (const [name, base64, type] of items) {
    buf.push(
      `dirData[${JSON.stringify(name)}] = [decode("${base64}"), "${type}"];`,
    );
  }
  buf.push('addEventListener("fetch", (e) => {');
  if (opts.basicAuth) {
    const [user, password] = opts.basicAuth.split(":");
    if (!user || !password) {
      throw new Error(
        `Invalid form of basic auth creadentials: ${opts.basicAuth}`,
      );
    }
    buf.push(
      `  const unauthorized = basicAuth(e.request, "Access to the site", ${
        JSON.stringify({ [user]: password })
      });
  if (unauthorized) {
    e.respondWith(unauthorized);
    return;
  }
`,
    );
  }
  buf.push(`  let { pathname } = new URL(e.request.url);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  let data = dirData[pathname];
  if (!data) {
    data = dirData[pathname + '.html'];
  }
  if (data) {
    const [bytes, mediaType] = data;
    const acceptsGzip = e.request.headers.get("accept-encoding")?.split(/[,;]\s*/).includes("gzip");
    if (acceptsGzip) {
      e.respondWith(new Response(bytes, { headers: {
        "content-type": mediaType,
        "content-encoding": "gzip",
      } }));
    } else {
      e.respondWith(new Response(gunzip(bytes), { headers: { "content-type": mediaType } }));
    }
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});`);

  return buf.join("\n");
}

const MEDIA_TYPES: Record<string, string> = {
  ".md": "text/markdown",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".png": "image/png",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".map": "application/json",
  ".txt": "text/plain",
  ".ts": "text/typescript",
  ".tsx": "text/tsx",
  ".js": "application/javascript",
  ".jsx": "text/jsx",
  ".gz": "application/gzip",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".mjs": "application/javascript",
  ".svg": "image/svg+xml",
};

export function getMediaType(path: string): string {
  const m = path.toLowerCase().match(/\.[a-z]+$/);
  if (m) {
    const [ext] = m;
    const mediaType = MEDIA_TYPES[ext];
    if (mediaType) {
      return mediaType;
    }
  }
  return "text/plain";
}
