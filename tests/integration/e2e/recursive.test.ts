import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("resolve<T>() recursively resolves constructor dependencies", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/recursive.ts");

  expect(mod.result).toBeDefined();
  expect(mod.result?.constructor?.name).toBe("AppService");
  expect((mod.result as { logger: unknown }).logger?.constructor?.name).toBe("LoggerService");
});
