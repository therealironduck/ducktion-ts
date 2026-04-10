import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "vite";

import { PACKAGE_NAME } from "../src/constants";
import plugin from "../src/vite";

const rootDir = path.resolve(import.meta.dirname, "..");
const distDir = path.join(import.meta.dirname, "dist");

const alias = {
  [PACKAGE_NAME]: path.join(rootDir, "src/index.ts"),
};

console.log("Building playground through ducktion-ts plugin...\n");

await build({
  plugins: [plugin()],
  resolve: { alias },
  logLevel: "info",
  build: {
    outDir: distDir,
    write: true,
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: path.join(import.meta.dirname, "src/main.ts"),
      formats: ["es"],
      fileName: "main",
    },
    rollupOptions: {
      treeshake: false,
      external: ["unplugin", "typescript"],
    },
  },
});

// Find the output file (main.js or main.mjs)
const outputFile = readdirSync(distDir)
  .filter((f) => f.startsWith("main") && (f.endsWith(".js") || f.endsWith(".mjs")))
  .map((f) => path.join(distDir, f))[0];

if (!outputFile) {
  console.error("No output file found in playground/dist/");
  process.exit(1);
}

const transformed = readFileSync(outputFile, "utf-8");
console.log("\n--- Transformed output (plugin applied) ---\n");
console.log(transformed);
console.log("--- End of transformed output ---\n");

console.log("--- Importing and checking results ---\n");

// Add a cache-busting export wrapper so we can see results standalone
const wrapperFile = path.join(distDir, `main-run-${Date.now()}.mjs`);
const wrapperCode = `${transformed}
console.log("=== Ducktion-TS Playground ===\\n");
console.log("GreetingService resolved:", greeting?.constructor?.name === "GreetingService" ? "✓ GreetingService" : "✗ FAILED");
console.log("Unregistered token returns undefined:", unregistered === undefined ? "✓ correct" : "✗ FAILED");
console.log("\\nAll checks done.");
`;
writeFileSync(wrapperFile, wrapperCode);
await import(wrapperFile);
