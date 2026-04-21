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

test('it converts `register<T>()` calls into `__registerAs("token", T)` at build time', async () => {
  const code = await bundle("./tests/stubs/raw.ts");

  expect(code).toMatch(/__registerAs\("[^"]+#MyInterface",\s*MyInterface\)/);
  expect(code).toMatch(/__registerAs\("[^"]+#OtherService",\s*OtherService\)/);
  expect(code).not.toContain("register<MyInterface>");
  expect(code).not.toContain("register<OtherService>");
});

test("it does not replace `register<T>()` calls on unrelated classes", async () => {
  const code = await bundle("./tests/stubs/unrelated.ts");

  expect(code).not.toContain("__registerAs(");
});

test("it propagates a build error when a DI method is called without type arguments", async () => {
  await expect(bundle("./tests/stubs/missing-type-arg.ts")).rejects.toThrow(
    "`register()` called without required type arguments",
  );
});

test("it only replaces `register<T>()` on DiContainer, not on unrelated classes in the same file", async () => {
  const code = await bundle("./tests/stubs/mixed.ts");

  expect(code).toMatch(/__registerAs\("[^"]+#MyService",\s*MyService\)/);
  expect(code).not.toMatch(/__registerAs\("[^"]+#IOtherService"/);
});
