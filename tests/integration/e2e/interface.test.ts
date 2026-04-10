import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("register<T>() throws when T is an interface", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/interface.ts");
  expect(() => (mod.registerInterface as () => void)()).toThrow(
    "Interfaces have no runtime value and cannot be instantiated.",
  );
});

test("registerAs<Interface, Implementation>() resolves the interface token as the concrete implementation", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/interface.ts");
  const result = (mod.registerAsAndResolveInterface as () => unknown)();
  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("GreetingService");
});
