import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build, type Rollup } from "vite";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/vite";

const alias = {
  [PACKAGE_NAME]: path.resolve("./src/index.ts"),
};

test("it transforms and correctly executes DI registration and resolution end-to-end", async () => {
  const result = await build({
    plugins: [plugin()],
    resolve: { alias },
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: "./playground/src/main.ts",
        formats: ["es"],
      },
      rollupOptions: {
        treeshake: false,
        external: ["unplugin", "typescript"],
      },
    },
  });

  const buildResult = result as Rollup.RolldownOutput | Rollup.RolldownOutput[];
  const outputs = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output;
  const code = outputs[0].code;

  // Write to a unique temp file to avoid module caching between runs
  const tmpFile = path.join(tmpdir(), `ducktion-e2e-${Date.now()}.mjs`);
  writeFileSync(tmpFile, code);

  // Dynamically import and verify the business logic executes correctly
  const mod = await import(tmpFile);

  expect(mod.greeting).toBeDefined();
  expect(mod.greeting?.constructor?.name).toBe("GreetingService");

  expect(mod.unregistered).toBeUndefined();
});
