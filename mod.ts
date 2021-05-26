import { walk } from "https://deno.land/std@0.97.0/fs/walk.ts";
import { encode } from "https://deno.land/std@0.97.0/encoding/base64.ts";
import { join, relative } from "https://deno.land/std@0.97.0/path/mod.ts";

export async function readDirCreateSource(
  dir: string,
  root = "/",
): Promise<string> {
  const buf: string[] = [];
  if (!root.startsWith("/")) {
    root = "/" + root;
  }
  buf.push("const dirData: Record<string, Uint8Array> = {};");
  const items: [string, string, string][] = [];
  for await (const { path } of walk(dir)) {
    const stat = await Deno.lstat(path);
    if (stat.isDirectory) {
      continue;
    }
    const name = join(root, relative(dir, path));
    const type = getMediaType(name);
    const contents = await Deno.readFile(path);
    const base64 = encode(contents);
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
      `dirData[${
        JSON.stringify(name)
      }] = [Uint8Array.from(atob("${base64}"), (c) => c.charCodeAt(0)), "${type}"];`,
    );
  }
  buf.push(`
addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  const data = dirData[pathname];
  if (data) {
    const [bytes, mediaType] = data;
    e.respondWith(new Response(bytes, { headers: { "content-type": mediaType } }));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});`.trim());

  return buf.join("\n");
}

const MEDIA_TYPES: Record<string, string> = {
  ".md": "text/markdown",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
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
