import { expect, test } from "vitest";

import { transformAbstractClasses } from "../../src/plugin/transformAbstractClasses";

test("injects static __ducktionAbstract = true into a plain abstract class with no body", () => {
  const code = `abstract class BaseService {}`;
  const result = transformAbstractClasses(code, "/project/src/base.ts");
  expect(result).toContain("static __ducktionAbstract = true;");
  expect(result).toContain("abstract class BaseService");
});

test("injects static __ducktionAbstract = true as the first member of an abstract class with existing members", () => {
  const code = `abstract class BaseService {\n  abstract greet(): string;\n}`;
  const result = transformAbstractClasses(code, "/project/src/base.ts");
  expect(result).toContain("static __ducktionAbstract = true;");
  const abstractPos = result.indexOf("static __ducktionAbstract = true;");
  const greetPos = result.indexOf("abstract greet()");
  expect(abstractPos).toBeLessThan(greetPos);
});

test("does not modify a regular (non-abstract) class", () => {
  const code = `class ConcreteService {\n  greet(): string { return "hi"; }\n}`;
  const result = transformAbstractClasses(code, "/project/src/service.ts");
  expect(result).toBe(code);
});

test("injects static __ducktionAbstract = true into a nested abstract class inside another class", () => {
  const code = `class Outer {\n  nested = class {};\n}\nabstract class Inner {\n  abstract work(): void;\n}`;
  const result = transformAbstractClasses(code, "/project/src/nested.ts");
  expect(result).toContain("static __ducktionAbstract = true;");
  // Outer (non-abstract) must not be modified
  expect(result.indexOf("static __ducktionAbstract")).toBeGreaterThan(result.indexOf("abstract class Inner"));
});

test("does not double-inject if __ducktionAbstract is already present", () => {
  const code = `abstract class BaseService { static __ducktionAbstract = true; }`;
  const result = transformAbstractClasses(code, "/project/src/base.ts");
  expect(result).toBe(code);
  expect(result.split("static __ducktionAbstract = true;")).toHaveLength(2); // exactly one occurrence
});

test("handles multiple abstract classes in the same file", () => {
  const code = `abstract class A {}\nabstract class B {}`;
  const result = transformAbstractClasses(code, "/project/src/multi.ts");
  expect(result.match(/static __ducktionAbstract = true;/g)).toHaveLength(2);
});
