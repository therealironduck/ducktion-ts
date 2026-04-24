import { describe, expect, test } from "vitest";

import { buildAndRun } from "./helper";

describe("@resolve() on public fields", () => {
  test("injects both fields after instantiation", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/decorators/public-field.ts");

    const result = mod.result as { simple: unknown; second: unknown };
    expect(result).toBeDefined();
    expect(result.simple?.constructor?.name).toBe("SimpleService");
    expect(result.second?.constructor?.name).toBe("SecondService");
  });
});

describe("@resolve() on private and protected fields", () => {
  test("injects both fields regardless of access modifier", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/decorators/private-protected-field.ts");

    const result = mod.result as { gSimple: unknown; gSecond: unknown };
    expect(result).toBeDefined();
    expect(result.gSimple?.constructor?.name).toBe("SimpleService");
    expect(result.gSecond?.constructor?.name).toBe("SecondService");
  });
});

describe("@resolve on a method", () => {
  test("calls the method post-instantiation with resolved arguments", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/decorators/method.ts");

    const result = mod.result as { simple: unknown; second: unknown };
    expect(result).toBeDefined();
    expect(result.simple?.constructor?.name).toBe("SimpleService");
    expect(result.second?.constructor?.name).toBe("SecondService");
  });
});

describe("@resolve('id') on a field", () => {
  test("resolves the id-qualified registration for the decorated field", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/decorators/field-with-id.ts");

    const result = mod.result as { default: unknown; formal: unknown };
    expect(result).toBeDefined();
    expect(result.default?.constructor?.name).toBe("GreetingService");
    expect(result.formal?.constructor?.name).toBe("FormalGreetingService");
  });
});

describe("@id() on constructor parameters", () => {
  test("resolves the id-qualified registration for the decorated parameter", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/decorators/constructor-id.ts");

    const result = mod.result as { formal: unknown; default_: unknown };
    expect(result).toBeDefined();
    expect(result.formal?.constructor?.name).toBe("FormalGreetingService");
    expect(result.default_?.constructor?.name).toBe("GreetingService");
  });
});

describe("@id() on method parameters", () => {
  test("resolves the id-qualified registration for the decorated method parameter", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/decorators/method-id.ts");

    const result = mod.result as { formal: unknown; default_: unknown };
    expect(result).toBeDefined();
    expect(result.formal?.constructor?.name).toBe("FormalGreetingService");
    expect(result.default_?.constructor?.name).toBe("GreetingService");
  });
});
