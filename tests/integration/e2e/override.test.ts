import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("override<IToken, Impl>() replaces a previously registered service", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/override.ts");

  expect(mod.result).toBeDefined();
  expect(mod.result?.constructor?.name).toBe("FormalGreetingService");
});
