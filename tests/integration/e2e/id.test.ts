import { expect, test } from "vitest";

import { buildAndRun } from "./helper";

test("register<T>(id) resolves each id to its own instance", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/id.ts");

  expect(mod.byConcreteA).toBeDefined();
  expect(mod.byConcreteA?.constructor?.name).toBe("GreetingService");

  expect(mod.byConcreteB).toBeDefined();
  expect(mod.byConcreteB?.constructor?.name).toBe("GreetingService");
});

test("registerAs<Token, Impl>(id) resolves each id to the correct implementation", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/id.ts");

  expect(mod.byInterfaceFormal).toBeDefined();
  expect(mod.byInterfaceFormal?.constructor?.name).toBe("FormalGreetingService");
});

test("override<Token, Impl>(id) replaces the implementation for that id only", async () => {
  const mod = await buildAndRun("./tests/stubs/e2e/id.ts");

  // "casual" was originally CasualGreetingService, then overridden to GreetingService
  expect(mod.byInterfaceCasual).toBeDefined();
  expect(mod.byInterfaceCasual?.constructor?.name).toBe("GreetingService");

  // "formal" must be unaffected by the override of "casual"
  expect(mod.byInterfaceFormal?.constructor?.name).toBe("FormalGreetingService");
});
