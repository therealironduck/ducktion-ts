import path from "node:path";
import { build, type Rollup } from "vite";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/vite";

const alias = {
  [PACKAGE_NAME]: path.resolve("./src/index.ts"),
};

test('it converts `register<T>()` calls into `__registerAs("token", T)` at build time', async () => {
  const result = await build({
    plugins: [plugin()],
    resolve: { alias },
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: "./tests/stubs/raw.ts",
        formats: ["es"],
      },
      rollupOptions: {
        treeshake: false,
      },
    },
  });

  const buildResult = result as Rollup.RolldownOutput | Rollup.RolldownOutput[];
  const outputs = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output;
  const code = outputs[0].code;

  expect(code).toMatch(/__registerAs\("[^"]+#MyInterface",\s*MyInterface\)/);
  expect(code).toMatch(/__registerAs\("[^"]+#OtherService",\s*OtherService\)/);
  expect(code).not.toContain("register<MyInterface>");
  expect(code).not.toContain("register<OtherService>");
});

test("it does not replace `register<T>()` calls on unrelated classes", async () => {
  const result = await build({
    plugins: [plugin()],
    resolve: { alias },
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: "./tests/stubs/unrelated.ts",
        formats: ["es"],
      },
      rollupOptions: {
        treeshake: false,
      },
    },
  });

  const buildResult = result as Rollup.RolldownOutput | Rollup.RolldownOutput[];
  const outputs = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output;
  const code = outputs[0].code;

  expect(code).not.toContain("register(IMyInterface)");
});

test("it propagates a build error when a DI method is called without type arguments", async () => {
  await expect(
    build({
      plugins: [plugin()],
      resolve: { alias },
      logLevel: "silent",
      build: {
        write: false,
        minify: false,
        lib: {
          entry: "./tests/stubs/missing-type-arg.ts",
          formats: ["es"],
        },
        rollupOptions: {
          treeshake: false,
        },
      },
    }),
  ).rejects.toThrow("`register()` called without required type arguments");
});

test("it only replaces `register<T>()` on DiContainer, not on unrelated classes in the same file", async () => {
  const result = await build({
    plugins: [plugin()],
    resolve: { alias },
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: "./tests/stubs/mixed.ts",
        formats: ["es"],
      },
      rollupOptions: {
        treeshake: false,
      },
    },
  });

  const buildResult = result as Rollup.RolldownOutput | Rollup.RolldownOutput[];
  const outputs = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output;
  const code = outputs[0].code;

  expect(code).toMatch(/__registerAs\("[^"]+#MyService",\s*MyService\)/);
  expect(code).not.toMatch(/__registerAs\("[^"]+#IOtherService"/);
});
