import type { UnpluginFactory } from "unplugin";

import { createUnplugin } from "unplugin";

import type { PluginOptions } from "./types";

import { transform } from "./plugin/transform";

const DEFAULT_EXCLUDES = ["node_modules"];

export const unpluginFactory: UnpluginFactory<PluginOptions | undefined> = (options) => {
  const excludes = options?.excludes ?? DEFAULT_EXCLUDES;

  return {
    name: "ducktion-ts",
    enforce: "pre",
    transformInclude(id) {
      if (!id.endsWith(".ts")) return false;
      const segments = id.split("/");
      return !excludes.some((pattern) => segments.includes(pattern));
    },
    transform,
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);
