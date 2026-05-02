import { describe, expect, test } from "vitest";

import { buildAndRun } from "./helper";

describe("@resolveTags() on a public field", () => {
  test("injects all tagged services into the field", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/resolve-tags/public-field.ts");

    const result = mod.result as { name: string }[];
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result.map((s) => s.name).sort()).toEqual(["TaggedA", "TaggedB"]);
  });
});

describe("@resolveTags() on constructor parameters", () => {
  test("injects all tagged services as a constructor argument", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/resolve-tags/constructor-args.ts");

    const result = mod.result as { name: string }[];
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result.map((s) => s.name).sort()).toEqual(["TaggedA", "TaggedB"]);
  });
});

describe("@resolveTags() on method parameters with @resolve", () => {
  test("injects all tagged services into the method and assigns them", async () => {
    const mod = await buildAndRun("./tests/stubs/e2e/resolve-tags/method-params.ts");

    const result = mod.result as { name: string }[];
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result.map((s) => s.name).sort()).toEqual(["TaggedA", "TaggedB"]);
  });
});
