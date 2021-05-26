import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { readDirCreateSource } from "./mod.ts";

Deno.test("readDirCreateSource", async () => {
  assertEquals(
    await readDirCreateSource("testdata"),
    `
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
`.trim(),
  );
});

Deno.test("readDirCreateSource with root", async () => {
  assertEquals(
    await readDirCreateSource("testdata", "/root"),
    `
const dirData: Record<string, Uint8Array> = {};
dirData["/root/bar.ts"] = Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0));
dirData["/root/foo.txt"] = Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0));
addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  const data = dirData[pathname];
  if (data) {
    e.respondWith(new Response(data));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
`.trim(),
  );
});

Deno.test("readDirCreateSource with root 2", async () => {
  assertEquals(
    await readDirCreateSource("testdata", "root"),
    `
const dirData: Record<string, Uint8Array> = {};
dirData["/root/bar.ts"] = Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0));
dirData["/root/foo.txt"] = Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0));
addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  const data = dirData[pathname];
  if (data) {
    e.respondWith(new Response(data));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
`.trim(),
  );
});
