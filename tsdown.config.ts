import { defineConfig } from "tsdown";

export default defineConfig({
  deps: {
    skipNodeModulesBundle: true,
  },
  dts: false,
  entry: ["src/index.ts", "src/vite.ts", "src/rolldown.ts", "src/esbuild.ts"],
});
