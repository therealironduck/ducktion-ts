import path from "node:path";

/**
 * Builds a unique string token for a type, encoding its import source so that
 * identically-named types from different packages produce different tokens.
 */
export function buildToken(typeName: string, importMap: Map<string, string>, fileId: string): string {
  // Strip any trailing generic parameters: "IFoo<string>" → "IFoo"
  const baseName = typeName.replace(/<.*>$/s, "").trim();

  const importSource = importMap.get(baseName);
  if (importSource) {
    if (importSource.startsWith(".")) {
      const resolved = path.resolve(path.dirname(fileId), importSource).replace(/\\/g, "/");
      return `${resolved}#${baseName}`;
    }
    return `${importSource}#${baseName}`;
  }

  // Type is defined in the same file — use the file path as the namespace.
  return `${fileId.replace(/\\/g, "/")}#${baseName}`;
}
