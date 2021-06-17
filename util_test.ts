import { assertEquals } from "https://deno.land/std@0.99.0/testing/asserts.ts";
import { parseCacheOption } from "./util.ts";

Deno.test("parseCacheOption", () => {
  assertEquals(parseCacheOption("/css:max-age=3600,/img:max-age=86400"), {
    "/css": "max-age=3600",
    "/img": "max-age=86400",
  });
});
