import { build } from "esbuild";
import path from "node:path";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/esbuild";

async function bundle(entry: string, options?: Parameters<typeof plugin>[0]): Promise<string> {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: "node",
    alias: { [PACKAGE_NAME]: path.resolve("./src/index.ts") },
    external: ["unplugin"],
    plugins: [plugin(options)],
    logLevel: "silent",
  });
  return result.outputFiles[0].text;
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

test("it skips transformation for files matching a custom excludes pattern", async () => {
  const code = await bundle("./tests/stubs/vendor/raw.ts", { excludes: ["vendor"] });

  expect(code).not.toMatch(/__registerAs\("[^"]+#MyInterface"/);
});

test("it still transforms files whose name contains the excluded segment as a substring", async () => {
  const code = await bundle("./tests/stubs/raw.ts", { excludes: ["vendor"] });

  expect(code).toMatch(/__registerAs\("[^"]+#MyInterface",\s*MyInterface\)/);
});

test("it only replaces `register<T>()` on DiContainer, not on unrelated classes in the same file", async () => {
  const code = await bundle("./tests/stubs/mixed.ts");

  expect(code).toMatch(/__registerAs\("[^"]+#MyService",\s*MyService\)/);
  expect(code).not.toMatch(/__registerAs\("[^"]+#IOtherService"/);
});
