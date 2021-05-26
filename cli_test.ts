import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { join, resolve } from "https://deno.land/std@0.97.0/path/mod.ts";
import { main } from "./cli.ts";

Deno.test("deploy_dir -h", async () => {
  const code = await main(["-h"]);
  assertEquals(code, 0);
});

Deno.test("deploy_dir -v", async () => {
  const code = await main(["-v"]);
  assertEquals(code, 0);
});

Deno.test("deploy_dir - target dir is not given", async () => {
  const code = await main([]);
  assertEquals(code, 1);
});

Deno.test("deploy_dir testdata", async () => {
  const tempdir = await Deno.makeTempDir();
  const code = await denoRun([resolve("cli.ts"), resolve("testdata")], { cwd: tempdir });
  assertEquals(code, 0);
  const source = await Deno.readTextFile(join(tempdir, "deploy.ts"));
  assertStringIncludes(source, "addEventListener");
  assertStringIncludes(source, "foo.txt");
  assertStringIncludes(source, "bar.ts");
});

async function denoRun(args: string[], { cwd }: { cwd?: string } = {}): Promise<number> {
  const p = Deno.run({
    cmd: [Deno.execPath(), "run", "-A", ...args],
    cwd,
  });
  const status = await p.status()
  p.close();
  return status.code;
}
