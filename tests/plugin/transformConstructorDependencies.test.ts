import { describe, expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import { transformConstructorDependencies } from "../../src/plugin/transformConstructorDependencies";

describe("@id() on constructor parameters", () => {
  test("injects id field into __ducktionDependencies for the decorated parameter", () => {
    const code = `
import { id } from "${PACKAGE_NAME}";
import { SimpleService } from "./simple-service";
import { SecondSimpleService } from "./second-simple-service";
class Consumer {
  constructor(@id("primary") simple: SimpleService, other: SecondSimpleService) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).toContain('id: "primary"');
    // The second parameter has no @id, so it must NOT carry an id field
    expect(result).toContain('"other"');
    expect(result).toMatch(/name: "other".*(?!id:)/s);
  });

  test("omits id field when @id is not present on the parameter", () => {
    const code = `
import { id } from "${PACKAGE_NAME}";
import { SimpleService } from "./simple-service";
class Consumer {
  constructor(simple: SimpleService) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).not.toContain("id:");
    expect(result).toContain("__ducktionDependencies");
  });

  test("injects id on multiple parameters independently", () => {
    const code = `
import { id } from "${PACKAGE_NAME}";
import { ServiceA } from "./service-a";
import { ServiceB } from "./service-b";
class Consumer {
  constructor(@id("alpha") a: ServiceA, @id("beta") b: ServiceB) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).toContain('id: "alpha"');
    expect(result).toContain('id: "beta"');
  });

  test("does not inject id when @id comes from a different package", () => {
    const code = `
import { id } from "some-other-lib";
import { SimpleService } from "./simple-service";
class Consumer {
  constructor(@id("primary") simple: SimpleService) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).not.toContain('id: "primary"');
  });

  test("ignores @id when argument is not a string literal", () => {
    const code = `
import { id } from "${PACKAGE_NAME}";
import { SimpleService } from "./simple-service";
const MY_ID = "primary";
class Consumer {
  constructor(@id(MY_ID) simple: SimpleService) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).not.toContain("id:");
  });
});

describe("@resolveTags() on constructor parameters", () => {
  test("injects tag-based entry into __ducktionDependencies for the decorated parameter", () => {
    const code = `
import { resolveTags } from "${PACKAGE_NAME}";
class Consumer {
  constructor(@resolveTags("example") simple: object[]) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).toContain('token: "ducktion__tag"');
    expect(result).toContain('tag: "example"');
    expect(result).toContain('name: "simple"');
  });

  test("does not inject a concrete or token field for the resolved type", () => {
    const code = `
import { resolveTags } from "${PACKAGE_NAME}";
class Consumer {
  constructor(@resolveTags("example") items: object[]) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).not.toContain("concrete:");
    expect(result).not.toContain("id:");
  });

  test("handles mixed parameters: tagged and normal", () => {
    const code = `
import { resolveTags } from "${PACKAGE_NAME}";
import { SimpleService } from "./simple-service";
class Consumer {
  constructor(@resolveTags("example") items: object[], other: SimpleService) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).toContain('tag: "example"');
    expect(result).toContain('name: "items"');
    expect(result).toContain('name: "other"');
    // Only the tagged param uses ducktion__tag; the normal one gets a real token
    const taggedEntry = result.match(/\{[^}]*"ducktion__tag"[^}]*\}/)?.[0];
    expect(taggedEntry).toBeDefined();
    expect(taggedEntry).not.toContain('"other"');
    expect(result).toContain("/project/src/simple-service#SimpleService");
  });

  test("does not inject tag when @resolveTags comes from a different package", () => {
    const code = `
import { resolveTags } from "some-other-lib";
class Consumer {
  constructor(@resolveTags("example") items: object[]) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).not.toContain('tag: "example"');
    expect(result).not.toContain('"ducktion__tag"');
  });

  test("ignores @resolveTags when argument is not a string literal", () => {
    const code = `
import { resolveTags } from "${PACKAGE_NAME}";
const TAG = "example";
class Consumer {
  constructor(@resolveTags(TAG) items: object[]) {}
}
`.trim();

    const result = transformConstructorDependencies(code, "/project/src/app.ts");
    expect(result).not.toContain("tag:");
    expect(result).not.toContain('"ducktion__tag"');
  });
});
