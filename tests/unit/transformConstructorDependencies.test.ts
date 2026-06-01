import { expect, test } from "vitest";

import { SCALAR_TOKEN } from "../../src/constants";
import { transformConstructorDependencies } from "../../src/plugin/transformConstructorDependencies";

const FILE_ID = "/project/src/service.ts";

test("injects __ducktionDependencies for a class with a single typed constructor param", () => {
  const code = `
import type { ILogger } from "./logger";
class FooService {
  constructor(private logger: ILogger) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toContain("static __ducktionDependencies =");
  expect(result).toContain(`name: "logger"`);
  expect(result).toContain("/project/src/logger#ILogger");
});

test("injects tokens in the same order as constructor parameters", () => {
  const code = `
import type { ILogger } from "./logger";
import type { IDb } from "./db";
class FooService {
  constructor(private logger: ILogger, private db: IDb) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  const loggerPos = result.indexOf("/project/src/logger#ILogger");
  const dbPos = result.indexOf("/project/src/db#IDb");
  expect(loggerPos).toBeGreaterThan(-1);
  expect(dbPos).toBeGreaterThan(-1);
  expect(loggerPos).toBeLessThan(dbPos);
});

test("includes the original parameter name in each entry", () => {
  const code = `
import type { ILogger } from "./logger";
import type { IDb } from "./db";
class FooService {
  constructor(private logger: ILogger, private database: IDb) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toContain(`name: "logger"`);
  expect(result).toContain(`name: "database"`);
});

test("does not modify a class with no constructor", () => {
  const code = `class FooService {}`;
  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toBe(code);
});

test("does not modify a class with a no-parameter constructor", () => {
  const code = `class FooService { constructor() {} }`;
  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toBe(code);
});

test("does not modify an abstract class", () => {
  const code = `abstract class BaseService { constructor(private x: string) {} }`;
  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).not.toContain("__ducktionDependencies");
});

test("does not double-inject if __ducktionDependencies is already present", () => {
  const code = `
import type { ILogger } from "./logger";
class FooService {
  static __ducktionDependencies = [{ name: "logger", token: "/project/src/logger#ILogger" }];
  constructor(private logger: ILogger) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toBe(code);
  expect(result.split("__ducktionDependencies")).toHaveLength(2); // exactly one occurrence
});

test("uses file path as namespace for same-file types", () => {
  const code = `
class Logger {}
class FooService {
  constructor(private logger: Logger) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toContain(`${FILE_ID}#Logger`);
});

test.each([
  ["string", "string"],
  ["number", "number"],
  ["boolean", "boolean"],
  ["bigint", "bigint"],
  ["symbol", "symbol"],
  ["null", "null"],
  ["undefined", "undefined"],
])("uses SCALAR_TOKEN for primitive type %s", (_label, primitiveType) => {
  const code = `class FooService { constructor(private value: ${primitiveType}) {} }`;
  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toContain(`token: "${SCALAR_TOKEN}"`);
  expect(result).not.toContain(`#${primitiveType}`);
});

test("mixes scalar and non-scalar tokens in the same constructor", () => {
  const code = `
import type { ILogger } from "./logger";
class FooService {
  constructor(private name: string, private logger: ILogger) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result).toContain(`token: "${SCALAR_TOKEN}"`);
  expect(result).toContain("/project/src/logger#ILogger");
});

test("handles multiple classes in the same file independently", () => {
  const code = `
import type { ILogger } from "./logger";
import type { IDb } from "./db";
class FooService {
  constructor(private logger: ILogger) {}
}
class BarService {
  constructor(private db: IDb) {}
}`.trim();

  const result = transformConstructorDependencies(code, FILE_ID);
  expect(result.match(/static __ducktionDependencies/g)).toHaveLength(2);
  expect(result).toContain("/project/src/logger#ILogger");
  expect(result).toContain("/project/src/db#IDb");
});
