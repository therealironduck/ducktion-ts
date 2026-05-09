import { defineConfig } from "tsdown";

export default defineConfig({
  deps: {
    skipNodeModulesBundle: true,
  },
  entry: ["src/index.ts", "src/vite.ts", "src/rolldown.ts", "src/rollup.ts"],
});
