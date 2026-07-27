export type PluginOptions = {
  /**
   * Here you can define which paths are excluded for transformation.
   * Meaning all paths that are excluded cannot be auto resolved and
   * don't have their dependencies scanned automatically.
   *
   * @default ['node_modules']
   */
  excludes?: string[];
};
