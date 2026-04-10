import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("register<T>() throws when T is an enum", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/enum.ts");
  expect(() => (mod.registerEnum as () => void)()).toThrow(
    "Enums are not instantiable classes and cannot be registered as services.",
  );
});
