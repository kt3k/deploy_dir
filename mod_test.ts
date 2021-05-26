import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { getMediaType, readDirCreateSource } from "./mod.ts";

Deno.test("readDirCreateSource", async () => {
  assertEquals(
    await readDirCreateSource("testdata"),
    `
const dirData: Record<string, [Uint8Array, string]> = {};
dirData["/bar.ts"] = [Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0)), "text/typescript"];
dirData["/foo.txt"] = [Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0)), "text/plain"];
dirData["/index.html"] = [Uint8Array.from(atob("SGVsbG8hCg=="), (c) => c.charCodeAt(0)), "text/html"];
addEventListener("fetch", (e) => {
  let { pathname } = new URL(e.request.url);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  const data = dirData[pathname];
  if (data) {
    const [bytes, mediaType] = data;
    e.respondWith(new Response(bytes, { headers: { "content-type": mediaType } }));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
`.trim(),
  );
});

Deno.test("readDirCreateSource - toJavaScript", async () => {
  assertEquals(
    await readDirCreateSource("testdata", undefined, { toJavaScript: true }),
    `
const dirData = {};
dirData["/bar.ts"] = [Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0)), "text/typescript"];
dirData["/foo.txt"] = [Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0)), "text/plain"];
dirData["/index.html"] = [Uint8Array.from(atob("SGVsbG8hCg=="), (c) => c.charCodeAt(0)), "text/html"];
addEventListener("fetch", (e) => {
  let { pathname } = new URL(e.request.url);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  const data = dirData[pathname];
  if (data) {
    const [bytes, mediaType] = data;
    e.respondWith(new Response(bytes, { headers: { "content-type": mediaType } }));
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
const dirData: Record<string, [Uint8Array, string]> = {};
dirData["/root/bar.ts"] = [Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0)), "text/typescript"];
dirData["/root/foo.txt"] = [Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0)), "text/plain"];
dirData["/root/index.html"] = [Uint8Array.from(atob("SGVsbG8hCg=="), (c) => c.charCodeAt(0)), "text/html"];
addEventListener("fetch", (e) => {
  let { pathname } = new URL(e.request.url);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  const data = dirData[pathname];
  if (data) {
    const [bytes, mediaType] = data;
    e.respondWith(new Response(bytes, { headers: { "content-type": mediaType } }));
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
const dirData: Record<string, [Uint8Array, string]> = {};
dirData["/root/bar.ts"] = [Uint8Array.from(atob("Y29uc29sZS5sb2coImJhciIpOwo="), (c) => c.charCodeAt(0)), "text/typescript"];
dirData["/root/foo.txt"] = [Uint8Array.from(atob("Zm9vCg=="), (c) => c.charCodeAt(0)), "text/plain"];
dirData["/root/index.html"] = [Uint8Array.from(atob("SGVsbG8hCg=="), (c) => c.charCodeAt(0)), "text/html"];
addEventListener("fetch", (e) => {
  let { pathname } = new URL(e.request.url);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  const data = dirData[pathname];
  if (data) {
    const [bytes, mediaType] = data;
    e.respondWith(new Response(bytes, { headers: { "content-type": mediaType } }));
    return;
  }
  e.respondWith(new Response("404 Not Found", { status: 404 }));
});
`.trim(),
  );
});

Deno.test("getMediaType", () => {
  assertEquals(getMediaType("README.md"), "text/markdown");
  assertEquals(getMediaType("index.html"), "text/html");
  assertEquals(getMediaType("inde.htm"), "text/html");
  assertEquals(getMediaType("package.json"), "application/json");
  assertEquals(getMediaType("foo.txt"), "text/plain");
  assertEquals(getMediaType("foo.ts"), "text/typescript");
  assertEquals(getMediaType("Component.tsx"), "text/tsx");
  assertEquals(getMediaType("script.js"), "application/javascript");
  assertEquals(getMediaType("Component.jsx"), "text/jsx");
  assertEquals(getMediaType("archive.tar.gz"), "application/gzip");
  assertEquals(getMediaType("style.css"), "text/css");
  assertEquals(getMediaType("lib.wasm"), "application/wasm");
  assertEquals(getMediaType("mod.mjs"), "application/javascript");
  assertEquals(getMediaType("logo.svg"), "image/svg+xml");
});
