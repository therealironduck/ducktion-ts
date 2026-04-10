import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("register<T>() and resolve<T>() instantiates the registered service", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/register.ts");

  expect(mod.result).toBeDefined();
  expect(mod.result?.constructor?.name).toBe("GreetingService");
});
