import { describe, expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import { transform } from "../../src/plugin/transform";
import { SCALAR_TOKEN } from "../../src/plugin/transformConstructorDependencies";

describe("register<T>()", () => {
  test("transforms on a direct DiContainer import to __registerAs with a string token", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
DiContainer.singleton.register<MyService>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__registerAs("/project/src/services/my-service#MyService", MyService)');
    expect(result).not.toContain("register<MyService>");
  });

  test("transforms when container is stored in a variable", () => {
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

  test("transforms multiple calls in the same file", () => {
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

  test("replaces with a runtime throw when T is an interface", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
interface IGreetingService {}
DiContainer.singleton.register<IGreetingService>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain("throw new Error");
    expect(result).toContain("Interfaces have no runtime value and cannot be instantiated.");
  });

  test("replaces with a runtime throw when T is an enum", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
enum Direction { Up, Down }
DiContainer.singleton.register<Direction>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain("throw new Error");
    expect(result).toContain("Enums are not instantiable classes and cannot be registered as services.");
  });

  test("does not transform on an unrelated class", () => {
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

  test("does not transform on an unrelated class in a file that also imports the package", () => {
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
});

describe("resolve<T>()", () => {
  test("transforms resolve<ConcreteClass> to __resolveWithType with token and class reference", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
DiContainer.singleton.resolve<MyService>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__resolveWithType("/project/src/services/my-service#MyService", MyService)');
    expect(result).not.toContain("resolve<MyService>");
  });

  test("transforms when container is stored in a variable", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
const container = DiContainer.singleton;
container.resolve<MyService>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__resolveWithType("/project/src/services/my-service#MyService", MyService)');
    expect(result).not.toContain("resolve<MyService>");
  });

  test("transforms resolve<IInterface> to __resolveByToken when T is a type-only import", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { IMyService } from "./services/my-service";
DiContainer.singleton.resolve<IMyService>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__resolveByToken("/project/src/services/my-service#IMyService")');
    expect(result).not.toContain("resolve<IMyService>");
  });

  test("transforms resolve<IInterface> to __resolveByToken when T is a local interface", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
interface IMyService {}
DiContainer.singleton.resolve<IMyService>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain('__resolveByToken("test.ts#IMyService")');
    expect(result).not.toContain("resolve<IMyService>");
  });

  test.each(["string", "number", "boolean", "bigint", "symbol", "null", "undefined"])(
    "transforms resolve<%s> to __resolveByToken with the scalar token",
    (scalarType) => {
      const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.resolve<${scalarType}>();
`.trim();

      const result = transform(code, "test.ts");
      expect(result).toContain(`__resolveByToken("${SCALAR_TOKEN}")`);
      expect(result).not.toContain(`resolve<${scalarType}>`);
    },
  );
});

describe("no-op cases", () => {
  test("does not transform when there is no import from the package", () => {
    const code = `
DiContainer.singleton.register<IMyService>();
DiContainer.singleton.resolve<IMyService>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toBe(code);
  });
});

describe("registerAs<T, T2>()", () => {
  test("transforms with a relative import to __registerAs with a string token", () => {
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

  test("transforms with a package import to __registerAs with a string token", () => {
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

  test("transforms when container is stored in a variable", () => {
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

  test("replaces with a runtime throw when Impl is an interface", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
interface ILogger {}
interface IConsoleLogger {}
DiContainer.singleton.registerAs<ILogger, IConsoleLogger>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain("throw new Error");
    expect(result).toContain("Interfaces have no runtime value and cannot be instantiated.");
    expect(result).not.toContain("registerAs<ILogger, IConsoleLogger>");
  });

  test("replaces with a runtime throw when Impl is an enum", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
interface IDirection {}
enum Direction { Up, Down }
DiContainer.singleton.registerAs<IDirection, Direction>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain("throw new Error");
    expect(result).toContain("Enums are not instantiable classes and cannot be registered as services.");
    expect(result).not.toContain("registerAs<IDirection, Direction>");
  });

  test("does not transform with only one type argument", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.registerAs<IMyService>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toBe(code);
  });

  test("does not transform on an unrelated class", () => {
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
});

describe("override<T, T2>()", () => {
  test("transforms with a relative import to __override with a string token", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "./services/logger";
import { DebugLogger } from "./services/debug-logger";
DiContainer.singleton.override<ILogger, DebugLogger>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__override("/project/src/services/logger#ILogger", DebugLogger)');
    expect(result).not.toContain("override<ILogger, DebugLogger>");
  });

  test("transforms with a package import to __override with a string token", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "some-logger-lib";
import { DebugLogger } from "./debug-logger";
DiContainer.singleton.override<ILogger, DebugLogger>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__override("some-logger-lib#ILogger", DebugLogger)');
    expect(result).not.toContain("override<ILogger, DebugLogger>");
  });

  test("transforms when container is stored in a variable", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
import type { ILogger } from "./logger";
import { DebugLogger } from "./debug-logger";
const container = DiContainer.singleton;
container.override<ILogger, DebugLogger>();
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('__override("/project/src/logger#ILogger", DebugLogger)');
    expect(result).not.toContain("override<ILogger, DebugLogger>");
  });

  test("replaces with a runtime throw when Impl is an interface", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
interface ILogger {}
interface IConsoleLogger {}
DiContainer.singleton.override<ILogger, IConsoleLogger>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain("throw new Error");
    expect(result).toContain("Interfaces have no runtime value and cannot be instantiated.");
    expect(result).not.toContain("override<ILogger, IConsoleLogger>");
  });

  test("replaces with a runtime throw when Impl is an enum", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
interface IDirection {}
enum Direction { Up, Down }
DiContainer.singleton.override<IDirection, Direction>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain("throw new Error");
    expect(result).toContain("Enums are not instantiable classes and cannot be registered as services.");
    expect(result).not.toContain("override<IDirection, Direction>");
  });

  test("does not transform with only one type argument", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.override<IMyService>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toBe(code);
  });

  test("does not transform on an unrelated class", () => {
    const code = `
import DiContainer from "${PACKAGE_NAME}";
class EventBus {
  override<T, T2>(): void {}
}
const bus = new EventBus();
bus.override<IMyService, MyService>();
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toBe(code);
  });
});

describe("__ducktionDependencies injection", () => {
  test("sets concrete to the class reference for a concrete imported parameter", () => {
    const code = `
import { DebugLogger } from "./debug-logger";
class MyService {
  constructor(private logger: DebugLogger) {}
}
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain(
      '{ name: "logger", token: "/project/src/debug-logger#DebugLogger", concrete: DebugLogger }',
    );
  });

  test("sets concrete to undefined for a type-only import", () => {
    const code = `
import type { ILogger } from "./logger";
class MyService {
  constructor(private logger: ILogger) {}
}
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain('{ name: "logger", token: "/project/src/logger#ILogger", concrete: undefined }');
  });

  test("sets concrete to undefined for a local interface", () => {
    const code = `
interface ILogger {}
class MyService {
  constructor(private logger: ILogger) {}
}
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain('{ name: "logger", token: "test.ts#ILogger", concrete: undefined }');
  });

  test("sets concrete to undefined for a local enum", () => {
    const code = `
enum Direction { Up, Down }
class MyService {
  constructor(private dir: Direction) {}
}
`.trim();

    const result = transform(code, "test.ts");
    expect(result).toContain('{ name: "dir", token: "test.ts#Direction", concrete: undefined }');
  });

  test.each(["string", "number", "boolean", "bigint", "symbol", "null", "undefined"])(
    "sets concrete to undefined for scalar type %s",
    (scalarType) => {
      const code = `
class MyService {
  constructor(private value: ${scalarType}) {}
}
`.trim();

      const result = transform(code, "test.ts");
      expect(result).toContain(`{ name: "value", token: "${SCALAR_TOKEN}", concrete: undefined }`);
    },
  );

  test("handles mixed parameters correctly", () => {
    const code = `
import { DebugLogger } from "./debug-logger";
import type { IFormatter } from "./formatter";
class MyService {
  constructor(private logger: DebugLogger, private formatter: IFormatter, private timeout: number) {}
}
`.trim();

    const result = transform(code, "/project/src/app.ts");
    expect(result).toContain(
      '{ name: "logger", token: "/project/src/debug-logger#DebugLogger", concrete: DebugLogger }',
    );
    expect(result).toContain('{ name: "formatter", token: "/project/src/formatter#IFormatter", concrete: undefined }');
    expect(result).toContain(`{ name: "timeout", token: "${SCALAR_TOKEN}", concrete: undefined }`);
  });
});
