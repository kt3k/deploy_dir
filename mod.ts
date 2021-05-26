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
  for await (const { path } of walk(dir)) {
    const stat = await Deno.lstat(path);
    if (stat.isDirectory) {
      continue;
    }
    const name = join(root, relative(dir, path));
    const contents = await Deno.readFile(path);
    const base64 = encode(contents);
    buf.push(
      `dirData[${
        JSON.stringify(name)
      }] = Uint8Array.from(atob("${base64}"), (c) => c.charCodeAt(0));`,
    );
  }
  buf.push(`
addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  const data = dirData[pathname];
  if (data) {
    e.respondWith(new Response(data));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});`.trim());

  return buf.join("\n");
}
