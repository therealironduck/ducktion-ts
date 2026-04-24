import { describe, expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import { transformDecoratorMethods } from "../../src/plugin/transformDecoratorMethods";

describe("bare @resolve on a method", () => {
  test("injects __ducktionResolveMethods with a concrete dependency", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
class Consumer {
  @resolve
  public init(dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain("__ducktionResolveMethods");
    expect(result).toContain('methodKey: "init"');
    expect(result).toContain('name: "dep"');
    expect(result).toContain('"/project/src/my-service#MyService"');
    expect(result).toContain("MyService");
  });

  test("injects __ducktionResolveMethods with an interface dependency (undefined concrete)", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import type { IMyService } from "./my-service";
class Consumer {
  @resolve
  public init(dep: IMyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain('"/project/src/my-service#IMyService"');
    expect(result).toContain("concrete: undefined");
  });

  test("handles multiple parameters", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { ServiceA } from "./service-a";
import { ServiceB } from "./service-b";
class Consumer {
  @resolve
  public init(a: ServiceA, b: ServiceB) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain('name: "a"');
    expect(result).toContain('"/project/src/service-a#ServiceA"');
    expect(result).toContain('name: "b"');
    expect(result).toContain('"/project/src/service-b#ServiceB"');
  });

  test("handles multiple @resolve methods in the same class", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { ServiceA } from "./service-a";
import { ServiceB } from "./service-b";
class Consumer {
  @resolve
  public initA(a: ServiceA) {}
  @resolve
  public initB(b: ServiceB) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain('methodKey: "initA"');
    expect(result).toContain('methodKey: "initB"');
  });

  test("does not transform a method that is not decorated with @resolve", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
class Consumer {
  public init(dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform when resolve is not imported from the package", () => {
    const code = `
import { resolve } from "some-other-lib";
import { MyService } from "./my-service";
class Consumer {
  @resolve
  public init(dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform an abstract class", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
abstract class Consumer {
  @resolve
  public init(dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform when __ducktionResolveMethods is already present", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
class Consumer {
  static __ducktionResolveMethods = [];
  @resolve
  public init(dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });

  test("does not transform when @resolve is used as a call expression (property decorator form)", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
class Consumer {
  @resolve()
  public dep!: MyService;
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toBe(code);
  });
});

describe("@id() on method parameters", () => {
  test("injects id field for the decorated parameter", () => {
    const code = `
import { resolve, id } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
class Consumer {
  @resolve
  public init(@id("primary") dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain('id: "primary"');
  });

  test("only injects id for the decorated parameter, not others", () => {
    const code = `
import { resolve, id } from "${PACKAGE_NAME}";
import { ServiceA } from "./service-a";
import { ServiceB } from "./service-b";
class Consumer {
  @resolve
  public init(@id("primary") a: ServiceA, b: ServiceB) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain('id: "primary"');
    // ServiceB entry must not carry an id field — verify 'name: "b"' entry has no id
    const bEntry = result.match(/name: "b"[^}]*/)?.[0] ?? "";
    expect(bEntry).not.toContain("id:");
  });

  test("injects id on multiple parameters independently", () => {
    const code = `
import { resolve, id } from "${PACKAGE_NAME}";
import { ServiceA } from "./service-a";
import { ServiceB } from "./service-b";
class Consumer {
  @resolve
  public init(@id("alpha") a: ServiceA, @id("beta") b: ServiceB) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).toContain('id: "alpha"');
    expect(result).toContain('id: "beta"');
  });

  test("does not inject id when @id comes from a different package", () => {
    const code = `
import { resolve } from "${PACKAGE_NAME}";
import { id } from "some-other-lib";
import { MyService } from "./my-service";
class Consumer {
  @resolve
  public init(@id("primary") dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).not.toContain('id: "primary"');
  });

  test("does not inject id when @id argument is not a string literal", () => {
    const code = `
import { resolve, id } from "${PACKAGE_NAME}";
import { MyService } from "./my-service";
const MY_ID = "primary";
class Consumer {
  @resolve
  public init(@id(MY_ID) dep: MyService) {}
}
`.trim();

    const result = transformDecoratorMethods(code, "/project/src/app.ts");
    expect(result).not.toContain("id:");
  });
});
