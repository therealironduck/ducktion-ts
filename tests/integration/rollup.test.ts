import type { Plugin } from "rollup";

import fs from "node:fs";
import path from "node:path";
import { rollup } from "rollup";
import ts from "typescript";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/rollup";

const resolvedIndex = path.resolve("./src/index.ts");

function resolverPlugin(): Plugin {
  return {
    name: "resolver",
    resolveId(id, importer) {
      if (id === PACKAGE_NAME) return resolvedIndex;
      if (!importer || !id.startsWith(".")) return null;
      const base = path.resolve(path.dirname(importer), id);
      for (const ext of [".ts", "/index.ts"]) {
        const candidate = base + ext;
        if (fs.existsSync(candidate)) return candidate;
      }
      return null;
    },
  };
}

function stripTypesPlugin(): Plugin {
  return {
    name: "strip-types",
    transform(code, id) {
      if (!id.endsWith(".ts")) return null;
      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ESNext,
        },
      });
      return { code: result.outputText };
    },
  };
}

async function bundle(entry: string, options?: Parameters<typeof plugin>[0]): Promise<string> {
  const build = await rollup({
    input: entry,
    plugins: [resolverPlugin(), plugin(options), stripTypesPlugin()],
    external: (id) => id.startsWith("node:") || id === "unplugin",
  });

  const result = await build.generate({ format: "es" });
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
