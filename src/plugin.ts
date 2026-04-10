import type { UnpluginFactory } from "unplugin";

import { createUnplugin } from "unplugin";

import type { Options } from "./types";

import { transform } from "./plugin/transform";

export const unpluginFactory: UnpluginFactory<Options | undefined> = () => ({
  name: "ducktion-ts",
  enforce: "pre",
  transformInclude(id) {
    return id.endsWith(".ts");
  },
  transform,
});

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);
