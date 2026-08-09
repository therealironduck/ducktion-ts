import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "vite";

import { PACKAGE_NAME } from "../../../src/constants";
import plugin from "../../../src/vite";

const alias = {
  [PACKAGE_NAME]: path.resolve("./src/index.ts"),
};

/**
 * Builds the given entry file with the ducktion-ts plugin applied, writes the
 * output to a unique temp file, and dynamically imports it so the test can
 * inspect the exported values at runtime.
 */
export async function buildAndRun(entry: string): Promise<Record<string, unknown>> {
  const result = await build({
    plugins: [plugin()],
    resolve: { alias },
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry,
        formats: ["es"],
      },
    },
  });

  const buildResult = result as { output: { code: string }[] } | { output: { code: string }[] }[];
  const outputs = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output;
  const code = outputs[0].code;

  const tmpFile = path.join(tmpdir(), `ducktion-e2e-${randomUUID()}.mjs`);
  writeFileSync(tmpFile, code);

  return import(tmpFile);
}
