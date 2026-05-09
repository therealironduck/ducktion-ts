import path from "node:path";
import { createFsFromVolume, Volume } from "memfs";
import webpack from "webpack";
import { expect, test } from "vitest";

import { PACKAGE_NAME } from "../../src/constants";
import plugin from "../../src/webpack";

async function bundle(entry: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const vol = new Volume();
    const memoryFs = createFsFromVolume(vol);

    const compiler = webpack({
      mode: "none",
      target: "node",
      entry: path.resolve(entry),
      output: {
        path: "/",
        filename: "bundle.js",
      },
      resolve: {
        alias: { [PACKAGE_NAME]: path.resolve("./src/index.ts") },
        extensions: [".ts", ".js"],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: "ts-loader",
            options: { transpileOnly: true },
          },
        ],
      },
      externals: [
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request?.startsWith("node:") || request === "unplugin") {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ],
      plugins: [plugin()],
    });

    compiler.outputFileSystem = memoryFs as webpack.Compiler["outputFileSystem"];

    compiler.run((err, stats) => {
      if (err) return reject(err);
      if (stats?.hasErrors()) {
        const errors = stats.toJson().errors;
        return reject(new Error(errors?.[0]?.message ?? "Unknown webpack error"));
      }
      const code = vol.readFileSync("/bundle.js", "utf-8") as string;
      resolve(code);
    });
  });
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
