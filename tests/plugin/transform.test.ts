import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import { transform } from "../../src/plugin/transform";

// ---------------------------------------------------------------------------
// register<T>()
// ---------------------------------------------------------------------------

test("transforms register<T>() on a direct DiContainer import to __registerImplementation(T)", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.register<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain("__registerImplementation(IMyService)");
  expect(result).not.toContain("register<IMyService>");
});

test("transforms register<T>() when container is stored in a variable", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
const container = DiContainer.singleton;
container.register<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain("__registerImplementation(IMyService)");
  expect(result).not.toContain("register<IMyService>");
});

test("transforms multiple register<T>() calls in the same file", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.register<IMyService>();
DiContainer.singleton.register<IOtherService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain("__registerImplementation(IMyService)");
  expect(result).toContain("__registerImplementation(IOtherService)");
});

// ---------------------------------------------------------------------------
// resolve<T>()
// ---------------------------------------------------------------------------

test("transforms resolve<T>() on a direct DiContainer import to resolveByToken(T)", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
DiContainer.singleton.resolve<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain("resolveByToken(IMyService)");
  expect(result).not.toContain("resolve<IMyService>");
});

test("transforms resolve<T>() when container is stored in a variable", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
const container = DiContainer.singleton;
container.resolve<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain("resolveByToken(IMyService)");
  expect(result).not.toContain("resolve<IMyService>");
});

// ---------------------------------------------------------------------------
// both together
// ---------------------------------------------------------------------------

test("transforms both register<T>() and resolve<T>() in the same file", () => {
  const code = `
import DiContainer from "${PACKAGE_NAME}";
const container = DiContainer.singleton;
container.register<IMyService>();
const svc = container.resolve<IMyService>();
`.trim();

  const result = transform(code, "test.ts");
  expect(result).toContain("__registerImplementation(IMyService)");
  expect(result).toContain("resolveByToken(IMyService)");
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
  expect(result).toContain("__registerImplementation(IMyService)");
  expect(result).not.toContain("__registerImplementation(IOtherService)");
});
