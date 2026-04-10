import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("resolve<T>() returns undefined for an unregistered service", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/unregistered.ts");

  expect(mod.result).toBeUndefined();
});
