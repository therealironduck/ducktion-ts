/**
 * TypeScript erases generics, so `container.register<IMyService>()` compiles
 * down to `container.register()` — losing the type the DI container needs.
 * This plugin rewrites those calls before erasure:
 *
 *   container.register<DebugLogger>()             →  container.__registerAs("pkg#DebugLogger", DebugLogger)
 *   container.resolve<DebugLogger>()              →  container.__resolveByToken("pkg#DebugLogger")
 *   container.registerAs<ILogger, DebugLogger>()  →  container.__registerAs("pkg#ILogger", DebugLogger)
 *
 * Only calls on objects imported from this package are rewritten; same-named
 * methods on unrelated classes are left untouched. To add a new rewrite, add
 * an entry to METHOD_REPLACEMENTS below.
 *
 * For `registerAs`, the first type argument is converted to a string token that
 * encodes the import source, making tokens unique across packages:
 *   - relative import:  resolved absolute path + "#" + type name
 *   - package import:   package name + "#" + type name
 */

import path from "node:path";
import ts from "typescript";

import { PACKAGE_NAME } from "../constants";

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
 * Builds a unique string token for a type, encoding its import source so that
 * identically-named types from different packages produce different tokens.
 */
function buildToken(typeName: string, importMap: Map<string, string>, fileId: string): string {
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

/**
 * Walks a property access chain down to its root identifier.
 * e.g. `DiContainer.singleton.register` → `"DiContainer"`
 */
function getRootIdentifier(expr: ts.Expression): string | null {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return getRootIdentifier(expr.expression);
  return null;
}

/**
 * Collects all local names bound to imports from our package.
 * Handles: default imports, named imports, and namespace imports.
 */
function collectImportedNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;

    const spec = statement.moduleSpecifier;
    if (!ts.isStringLiteral(spec) || spec.text !== PACKAGE_NAME) continue;

    const clause = statement.importClause;
    if (!clause) continue;

    if (clause.name) {
      names.add(clause.name.text);
    }

    if (clause.namedBindings) {
      if (ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) {
          names.add(el.name.text);
        }
      } else if (ts.isNamespaceImport(clause.namedBindings)) {
        names.add(clause.namedBindings.name.text);
      }
    }
  }

  return names;
}

/**
 * Expands the seed set by following simple variable assignments and declarations
 * whose right-hand side roots back to an already-known binding.
 *
 * Handles:
 *   const container = DiContainer.singleton;
 *   let container; container = DiContainer.singleton;
 */
function collectDiBindings(sourceFile: ts.SourceFile, seed: Set<string>): Set<string> {
  const bindings = new Set(seed);

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
      const root = getRootIdentifier(node.initializer);
      if (root && bindings.has(root)) {
        bindings.add(node.name.text);
      }
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    ) {
      const root = getRootIdentifier(node.right);
      if (root && bindings.has(root)) {
        bindings.add(node.left.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return bindings;
}

/**
 * Builds a map from every locally-bound import name to its module specifier.
 * Unlike `collectImportedNames`, this covers ALL imports (not just those from
 * this package), so we can look up where any type argument comes from.
 */
function collectTypeImportMap(sourceFile: ts.SourceFile): Map<string, string> {
  const map = new Map<string, string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;

    const spec = statement.moduleSpecifier;
    if (!ts.isStringLiteral(spec)) continue;

    const source = spec.text;
    const clause = statement.importClause;
    if (!clause) continue;

    if (clause.name) {
      map.set(clause.name.text, source);
    }

    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        map.set(el.name.text, source);
      }
    }
  }

  return map;
}

export const transform = (code: string, id: string): string => {
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
