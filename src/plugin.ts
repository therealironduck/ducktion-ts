import type { UnpluginFactory } from "unplugin";

import { createUnplugin } from "unplugin";

import type { PluginOptions } from "./types";

import { transform } from "./plugin/transform";

export const unpluginFactory: UnpluginFactory<PluginOptions | undefined> = () => ({
  name: "ducktion-ts",
  enforce: "pre",
  transformInclude(id) {
    return id.endsWith(".ts");
  },
  transform,
});

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);
