import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import { transform } from "../../src/plugin/transform";

// ---------------------------------------------------------------------------
// register<T>()
// ---------------------------------------------------------------------------

test("transforms register<T>() on a direct DiContainer import to __registerAs with a string token", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
DiContainer.singleton.register<MyService>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/services/my-service#MyService", MyService)');
  expect(result).not.toContain("register<MyService>");
});

test("transforms register<T>() when container is stored in a variable", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
const container = DiContainer.singleton;
container.register<MyService>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/services/my-service#MyService", MyService)');
  expect(result).not.toContain("register<MyService>");
});

test("transforms multiple register<T>() calls in the same file", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
import { OtherService } from "./other-service";
DiContainer.singleton.register<MyService>();
DiContainer.singleton.register<OtherService>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/my-service#MyService", MyService)');
  expect(result).toContain('__registerAs("/project/src/other-service#OtherService", OtherService)');
});

// ---------------------------------------------------------------------------
// resolve<T>()
// ---------------------------------------------------------------------------

test("transforms resolve<T>() on a direct DiContainer import to __resolveByToken with a string token", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
DiContainer.singleton.resolve<MyService>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__resolveByToken("/project/src/services/my-service#MyService")');
  expect(result).not.toContain("resolve<MyService>");
});

test("transforms resolve<T>() when container is stored in a variable", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
const container = DiContainer.singleton;
container.resolve<MyService>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__resolveByToken("/project/src/services/my-service#MyService")');
  expect(result).not.toContain("resolve<MyService>");
});

// ---------------------------------------------------------------------------
// both together
// ---------------------------------------------------------------------------

test("transforms both register<T>() and resolve<T>() in the same file", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
const container = DiContainer.singleton;
container.register<MyService>();
const svc = container.resolve<MyService>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/my-service#MyService", MyService)');
  expect(result).toContain('__resolveByToken("/project/src/my-service#MyService")');
});

// ---------------------------------------------------------------------------
// no-op cases
// ---------------------------------------------------------------------------

test("does not transform when there is no import from the package", () => {
  const code = `
DiContainer.singleton.register<IMyService>();
DiContainer.singleton.resolve<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toBe(code);
});

test("does not transform register<T>() on an unrelated class", () => {
  const code = `
class EventBus {
  register<T>(): void {}
}
const bus = new EventBus();
bus.register<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toBe(code);
});

// ---------------------------------------------------------------------------
// registerAs<T, T2>()
// ---------------------------------------------------------------------------

test("transforms registerAs<IToken, IImpl>() with a relative import to __registerAs with a string token", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "./services/logger";
import { DebugLogger } from "./services/debug-logger";
DiContainer.singleton.registerAs<ILogger, DebugLogger>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/services/logger#ILogger", DebugLogger)');
  expect(result).not.toContain("registerAs<ILogger, DebugLogger>");
});

test("transforms registerAs<IToken, IImpl>() with a package import to __registerAs with a string token", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "some-logger-lib";
import { DebugLogger } from "./debug-logger";
DiContainer.singleton.registerAs<ILogger, DebugLogger>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("some-logger-lib#ILogger", DebugLogger)');
  expect(result).not.toContain("registerAs<ILogger, DebugLogger>");
});

test("generates different tokens for the same type name imported from different sources", () => {
  const codeA = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "./package-a/logger";
import { DebugLogger } from "./debug";
DiContainer.singleton.registerAs<ILogger, DebugLogger>();
`.trim();

  const codeB = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "./package-b/logger";
import { DebugLogger } from "./debug";
DiContainer.singleton.registerAs<ILogger, DebugLogger>();
`.trim();

  const resultA = transform(codeA, "/project/src/app.ts");
  const resultB = transform(codeB, "/project/src/app.ts");

  const tokenA = resultA.match(/"([^"]+#ILogger)"/)?.[1];
  const tokenB = resultB.match(/"([^"]+#ILogger)"/)?.[1];
  expect(tokenA).toBeDefined();
  expect(tokenB).toBeDefined();
  expect(tokenA).not.toBe(tokenB);
});

test("uses the file path as the token namespace when the type is defined in the same file", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import { DebugLogger } from "./debug-logger";
interface ILogger {}
DiContainer.singleton.registerAs<ILogger, DebugLogger>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/app.ts#ILogger", DebugLogger)');
});

test("transforms registerAs<T, T2>() when container is stored in a variable", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "./logger";
import { DebugLogger } from "./debug-logger";
const container = DiContainer.singleton;
container.registerAs<ILogger, DebugLogger>();
`.trim();

  const result = transform(code, "/project/src/app.ts");
  expect(result).toContain('__registerAs("/project/src/logger#ILogger", DebugLogger)');
  expect(result).not.toContain("registerAs<ILogger, DebugLogger>");
});

test("does not transform registerAs<T>() with only one type argument", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.registerAs<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toBe(code);
});

test("does not transform registerAs<T, T2>() on an unrelated class", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
class EventBus {
  registerAs<T, T2>(): void {}
}
const bus = new EventBus();
bus.registerAs<IMyService, MyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toBe(code);
});

// ---------------------------------------------------------------------------
// no-op cases (existing)
// ---------------------------------------------------------------------------

test("does not transform register<T>() on an unrelated class in a file that also imports the package", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
class EventBus {
  register<T>(): void {}
}
DiContainer.singleton.register<IMyService>();
const bus = new EventBus();
bus.register<IOtherService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain('__registerAs("test.ts#IMyService", IMyService)');
  expect(result).not.toContain("IOtherService)");
});
