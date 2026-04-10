import path from "node:path";
import { build, type Rollup } from "vite";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/vite";

const alias = {
  [PACKAGE_NAME]: path.resolve("./src/index.ts"),
};

test('it converts `register<T>()` calls into `__registerImplementation("T")` at build time', async () => {
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

  expect(code).toContain("__registerImplementation(IMyInterface)");
  expect(code).toContain("__registerImplementation(IOtherService)");
  expect(code).not.toContain("__registerImplementation<IMyInterface>");
  expect(code).not.toContain("__registerImplementation<IOtherService>");
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

  expect(code).toContain("__registerImplementation(IMyService)");
  expect(code).not.toContain("__registerImplementation(IOtherService)");
});
