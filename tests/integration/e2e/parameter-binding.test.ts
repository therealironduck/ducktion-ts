import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("setParameter() binds a scalar value to a constructor parameter", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/parameter-binding.ts");

  expect(mod.result).toBeDefined();
  expect(mod.result?.constructor?.name).toBe("ScalarService");

  const scalarService = mod.result as { scalar: number };
  expect(scalarService.scalar).toBe(24);
});
