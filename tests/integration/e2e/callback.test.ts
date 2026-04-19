import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("override<T, Impl>() with a callback uses the callback instead of instantiating the implementation", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/callback.ts");
  const result = (mod.overrideWithCallback as () => unknown)();

  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("GreetingService");
  expect((result as { greet: () => string }).greet()).toBe("Hello Overridden");
});

test("override<Interface, Implementation>() with a callback replaces an interface registration using the callback", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/callback.ts");
  const result = (mod.overrideInterfaceWithCallback as () => unknown)();

  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("GreetingService");
  expect((result as { greet: () => string }).greet()).toBe("Hello OverriddenInterface");
});

test("register<T>() with a callback uses the callback to resolve the service", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/callback.ts");
  const result = (mod.registerWithCallback as () => unknown)();

  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("GreetingService");
  expect((result as { greet: () => string }).greet()).toBe("Hello World");
});

test("registerAs<Interface, Implementation>() with a callback resolves the interface using the callback", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/callback.ts");
  const result = (mod.registerInterfaceWithCallback as () => unknown)();

  expect(result).toBeDefined();
  expect((result as { constructor: { name: string } }).constructor.name).toBe("GreetingService");
  expect((result as { greet: () => string }).greet()).toBe("Hello Interface");
});
