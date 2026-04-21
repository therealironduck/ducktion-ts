import ts from "typescript";

import { PACKAGE_NAME } from "../constants";

/**
 * Walks a property access chain down to its root identifier.
 * e.g. `DiContainer.singleton.register` → `"DiContainer"`
 */
export function getRootIdentifier(expr: ts.Expression): string | null {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return getRootIdentifier(expr.expression);
  return null;
}

/**
 * Collects all local names bound to imports from our package.
 * Handles: default imports, named imports, and namespace imports.
 */
export function collectImportedNames(sourceFile: ts.SourceFile): Set<string> {
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
export function collectDiBindings(sourceFile: ts.SourceFile, seed: Set<string>): Set<string> {
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
 * Collects names that were imported as type-only (`import type { Foo }` or
 * `import { type Foo }`). With verbatimModuleSyntax enabled, interfaces and
 * type aliases *must* use one of these forms, making this a reliable signal
 * that the name has no runtime value.
 */
export function collectTypeOnlyImports(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;

    const clause = statement.importClause;
    if (!clause) continue;

    if (clause.isTypeOnly) {
      // import type { Foo, Bar } from "..."
      if (clause.name) names.add(clause.name.text);
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) names.add(el.name.text);
      }
    } else if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      // import { type Foo } from "..."
      for (const el of clause.namedBindings.elements) {
        if (el.isTypeOnly) names.add(el.name.text);
      }
    }
  }

  return names;
}

/**
 * Collects the names of all interface declarations in the source file.
 * Used to catch same-file interfaces passed to register<T>().
 */
export function collectInterfaceNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) names.add(node.name.text);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return names;
}

/**
 * Collects the names of all enum declarations in the source file.
 * Used to catch same-file enums passed to register<T>().
 */
export function collectEnumNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  function visit(node: ts.Node) {
    if (ts.isEnumDeclaration(node)) names.add(node.name.text);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return names;
}

/**
 * Collects identifiers declared at the module top level via `function`, `const`/`let`/`var`,
 * or `class` statements. Used to detect shadowing of package imports by local declarations.
 */
export function collectLocalDeclarationNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) names.add(decl.name.text);
      }
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
    }
  }

  return names;
}

/**
 * Builds a map from every locally-bound import name to its module specifier.
 * Unlike `collectImportedNames`, this covers ALL imports (not just those from
 * this package), so we can look up where any type argument comes from.
 */
export function collectTypeImportMap(sourceFile: ts.SourceFile): Map<string, string> {
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
