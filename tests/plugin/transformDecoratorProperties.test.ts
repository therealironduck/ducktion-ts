import { describe, expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import { transformDecoratorProperties } from "../../src/plugin/transformDecoratorProperties";

describe("@resolve() on a concrete class property", () => {
  test("rewrites to resolve(token, ConcreteType) for a relative import", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
class Consumer {
  @resolve()
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toContain('resolve("/project/src/services/my-service#MyService", MyService)');
    expect(result).not.toContain("resolve()");
  });

  test("rewrites to resolve(token, ConcreteType) for a package import", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "some-lib";
class Consumer {
  @resolve()
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toContain('resolve("some-lib#MyService", MyService)');
  });

  test("uses the file path as the token namespace when the class is defined in the same file", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
class MyService {}
class Consumer {
  @resolve()
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toContain('resolve("/project/src/app.ts#MyService", MyService)');
  });

  test("handles multiple decorated properties in the same class", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { ServiceA } from "./service-a";
import { ServiceB } from "./service-b";
class Consumer {
  @resolve()
  public a: ServiceA;
  @resolve()
  public b: ServiceB;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toContain('resolve("/project/src/service-a#ServiceA", ServiceA)');
    expect(result).toContain('resolve("/project/src/service-b#ServiceB", ServiceB)');
  });

  test("generates different tokens for the same type name from different sources", () => {
    const codeA = `
import { resolve } from "${PACKAGE_NAME}";
import { Logger } from "./package-a/logger";
class Consumer {
  @resolve()
  public logger: Logger;
}
`.trim();

    const codeB = `
import { resolve } from "${PACKAGE_NAME}";
import { Logger } from "./package-b/logger";
class Consumer {
  @resolve()
  public logger: Logger;
}
`.trim();

    const resultA = transformDecoratorProperties(codeA, "/project/src/app.ts");
    const resultB = transformDecoratorProperties(codeB, "/project/src/app.ts");

    const tokenA = resultA.match(/"([^"]+#Logger)"/)?.[1];
    const tokenB = resultB.match(/"([^"]+#Logger)"/)?.[1];
    expect(tokenA).toBeDefined();
    expect(tokenB).toBeDefined();
    expect(tokenA).not.toBe(tokenB);
  });
});

describe("@resolve() on an interface property", () => {
  test("rewrites to resolve(token) only — no concrete type — for a type-only import", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import type { IMyService } from "./services/my-service";
class Consumer {
  @resolve()
  public dep: IMyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toContain('resolve("/project/src/services/my-service#IMyService")');
    expect(result).not.toContain("IMyService)");
  });

  test("rewrites to resolve(token) only for a local interface", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
interface IMyService {}
class Consumer {
  @resolve()
  public dep: IMyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "test.ts");
    expect(result).toContain('resolve("test.ts#IMyService")');
    expect(result).not.toContain("IMyService)");
  });

  test("rewrites to resolve(token) only for a local enum", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
enum Direction { Up, Down }
class Consumer {
  @resolve()
  public dep: Direction;
}
`.trim();

    const result = transformDecoratorProperties(code, "test.ts");
    expect(result).toContain('resolve("test.ts#Direction")');
    expect(result).not.toContain("Direction)");
  });
});

describe("no-op cases", () => {
  test("does not transform when there is no import from the package", () => {
    const code = `
import { resolve } from "some-other-lib";
import { MyService } from "./services/my-service";
class Consumer {
  @resolve()
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform when @resolve already has arguments", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
class Consumer {
  @resolve("my-custom-token", MyService)
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform a property with no type annotation", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
class Consumer {
  @resolve()
  public dep = null;
}
`.trim();

    const result = transformDecoratorProperties(code, "test.ts");
    expect(result).toBe(code);
  });

  test("does not transform when the file has no package import at all", () => {
    const code = `
class Consumer {
  public dep: string;
}
`.trim();

    const result = transformDecoratorProperties(code, "test.ts");
    expect(result).toBe(code);
  });

  test("does not transform an undecorated property even when resolve is imported", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
class Consumer {
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform when a local declaration shadows the imported resolve", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./services/my-service";
function resolve() {}
class Consumer {
  @resolve()
  public dep: MyService;
}
`.trim();

    const result = transformDecoratorProperties(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });
});
