import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("registerAs<IToken, Impl>() maps an interface token to its implementation", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/register-as.ts");

  expect(mod.result).toBeDefined();
  expect(mod.result?.constructor?.name).toBe("GreetingService");
});
