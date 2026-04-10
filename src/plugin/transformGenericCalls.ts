/**
 * TypeScript erases generics, so `container.register<IMyService>()` compiles
 * down to `container.register()` — losing the type the DI container needs.
 * This transform rewrites those calls before erasure:
 *
 *   container.register<DebugLogger>()             →  container.__registerAs("pkg#DebugLogger", DebugLogger)
 *   container.resolve<DebugLogger>()              →  container.__resolveByToken("pkg#DebugLogger")
 *   container.registerAs<ILogger, DebugLogger>()  →  container.__registerAs("pkg#ILogger", DebugLogger)
 *
 * Only calls on objects imported from this package are rewritten; same-named
 * methods on unrelated classes are left untouched.
 */

import ts from "typescript";

import { buildToken } from "./buildToken";
import { collectDiBindings, collectImportedNames, collectTypeImportMap, getRootIdentifier } from "./collectImports";

type TransformArgs = {
  typeArgs: ts.NodeArray<ts.TypeNode>;
  sourceFile: ts.SourceFile;
  importMap: Map<string, string>;
  fileId: string;
};

type MethodConfig = {
  replacementName: string;
  /** Minimum number of type arguments required; calls with fewer are skipped. */
  requiredTypeArgs: number;
  buildArgs: (args: TransformArgs) => string;
};

/**
 * Maps generic-call method names to their runtime replacements.
 * Add entries here to support additional transformations in the future.
 */
const METHOD_REPLACEMENTS: Record<string, MethodConfig> = {
  register: {
    replacementName: "__registerAs",
    requiredTypeArgs: 1,
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId }) => {
      const typeName = typeArgs[0].getText(sourceFile);
      const token = buildToken(typeName, importMap, fileId);
      return `"${token}", ${typeName}`;
    },
  },
  resolve: {
    replacementName: "__resolveByToken",
    requiredTypeArgs: 1,
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId }) => {
      const typeName = typeArgs[0].getText(sourceFile);
      const token = buildToken(typeName, importMap, fileId);
      return `"${token}"`;
    },
  },
  registerAs: {
    replacementName: "__registerAs",
    requiredTypeArgs: 2,
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId }) => {
      const tokenTypeName = typeArgs[0].getText(sourceFile);
      const implTypeName = typeArgs[1].getText(sourceFile);
      const token = buildToken(tokenTypeName, importMap, fileId);
      return `"${token}", ${implTypeName}`;
    },
  },
};

export const transformGenericCalls = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);

  const importedNames = collectImportedNames(sourceFile);
  if (importedNames.size === 0) {
    return code;
  }

  const diBindings = collectDiBindings(sourceFile, importedNames);
  const importMap = collectTypeImportMap(sourceFile);

  const replacements: Array<{ start: number; end: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      node.typeArguments &&
      node.typeArguments.length > 0 &&
      node.arguments.length === 0 &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const methodName = node.expression.name.text;
      const config = METHOD_REPLACEMENTS[methodName];
      if (config !== undefined && node.typeArguments.length >= config.requiredTypeArgs) {
        const root = getRootIdentifier(node.expression.expression);
        if (root && diBindings.has(root)) {
          const args = config.buildArgs({
            typeArgs: node.typeArguments,
            sourceFile,
            importMap,
            fileId: id,
          });
          replacements.push({
            start: node.expression.name.getStart(sourceFile),
            end: node.end,
            text: `${config.replacementName}(${args})`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (replacements.length === 0) {
    return code;
  }

  replacements.sort((a, b) => b.start - a.start);

  let result = code;
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end);
  }

  return result;
};
