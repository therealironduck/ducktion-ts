/**
 * TypeScript erases generics, so `container.register<IMyService>()` compiles
 * down to `container.register()` — losing the type the DI container needs.
 * This plugin rewrites those calls before erasure:
 *
 *   container.register<IMyService>()  →  container.__registerImplementation(IMyService)
 *   container.resolve<IMyService>()   →  container.__resolveByToken(IMyService)
 *
 * Only calls on objects imported from this package are rewritten; same-named
 * methods on unrelated classes are left untouched. To add a new rewrite, add
 * an entry to METHOD_REPLACEMENTS below.
 */

import ts from "typescript";

import { PACKAGE_NAME } from "../constants";

/**
 * Maps generic-call method names to their runtime replacements.
 * Add entries here to support additional transformations in the future.
 */
const METHOD_REPLACEMENTS: Record<string, string> = {
  register: "__registerImplementation",
  resolve: "__resolveByToken",
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

export const transform = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);

  const importedNames = collectImportedNames(sourceFile);
  if (importedNames.size === 0) {
    return code;
  }

  const diBindings = collectDiBindings(sourceFile, importedNames);

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
      const replacementName = METHOD_REPLACEMENTS[methodName];
      if (replacementName !== undefined) {
        const root = getRootIdentifier(node.expression.expression);
        if (root && diBindings.has(root)) {
          const typeName = node.typeArguments[0].getText(sourceFile);
          replacements.push({
            start: node.expression.name.getStart(sourceFile),
            end: node.end,
            text: `${replacementName}(${typeName})`,
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
