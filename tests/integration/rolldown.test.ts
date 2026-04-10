import path from "node:path";
import { rolldown } from "rolldown";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/rolldown";

const alias = {
  [PACKAGE_NAME]: path.resolve("./src/index.ts"),
};

async function bundle(entry: string): Promise<string> {
  const build = await rolldown({
    input: entry,
    plugins: [plugin()],
    resolve: { alias },
    external: (id) => id.startsWith("node:") || id === "unplugin",
  });

  const result = await build.generate({ minify: false });
  return result.output[0].code;
}

test('it converts `register<T>()` calls into `register("T")` at build time', async () => {
  const code = await bundle("./tests/stubs/raw.ts");

  expect(code).toContain("__registerImplementation(IMyInterface)");
  expect(code).toContain("__registerImplementation(IOtherService)");
  expect(code).not.toContain("__registerImplementation<IMyInterface>");
  expect(code).not.toContain("__registerImplementation<IOtherService>");
});

test("it does not replace `register<T>()` calls on unrelated classes", async () => {
  const code = await bundle("./tests/stubs/unrelated.ts");

  expect(code).not.toContain("__registerImplementation(IMyInterface)");
});

test("it only replaces `register<T>()` on DiContainer, not on unrelated classes in the same file", async () => {
  const code = await bundle("./tests/stubs/mixed.ts");

  expect(code).toContain("__registerImplementation(IMyService)");
  expect(code).not.toContain("__registerImplementation(IOtherService)");
});
