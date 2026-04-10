import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("register<T>() throws when T is an abstract class", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/abstract.ts");
  expect(() => (mod.registerAbstract as () => void)()).toThrow("Service is abstract");
});

test("register<T>() succeeds for a concrete class that extends an abstract class", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/abstract.ts");
  const result = (mod.registerAndResolveConcrete as () => unknown)();
  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("ConcreteService");
});

test("registerAs<Abstract, Concrete>() allows resolving the abstract token as the concrete implementation", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/abstract.ts");
  const result = (mod.registerAsAndResolveAbstract as () => unknown)();
  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("ConcreteService");
});
