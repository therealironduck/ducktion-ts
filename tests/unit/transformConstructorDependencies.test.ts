import { expect, test } from "vitest";

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
  static __ducktionDependencies = ["/project/src/logger#ILogger"];
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
