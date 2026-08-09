import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("register and resolve types that are imported as types", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/import-type.ts");

  const result = (mod.registerAndResolveGreetingService as () => { service: { constructor: { name: string } } })();
  expect(result).toBeDefined();
  expect(result.service?.constructor.name).toBe("SimpleService");
});
