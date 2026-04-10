import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("resolve<T>() returns undefined for an unregistered service", async () => {
  await expect(buildAndRun("./tests/stubs/e2e/unregistered.ts")).rejects.toThrow("Service is not registered");
});
