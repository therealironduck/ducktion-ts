import type * as t from "@babel/types";

import { PACKAGE_NAME } from "../constants";
import {
  isAssignmentExpression,
  isClassDeclaration,
  isEnumDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isMemberExpression,
  isVariableDeclaration,
  isVariableDeclarator,
  type SourceFile,
  visit,
} from "./ast";

/**
 * Walks a property access chain down to its root identifier.
 * e.g. `DiContainer.singleton.register` → `"DiContainer"`
 */
export function getRootIdentifier(expr: unknown): string | null {
  if (isIdentifier(expr)) return expr.name;
  if (isMemberExpression(expr)) return getRootIdentifier(expr.object);
  return null;
}

/**
 * Collects all local names bound to imports from our package.
 * Handles: default imports, named imports, and namespace imports.
 */
export function collectImportedNames(sourceFile: SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.program.body) {
    if (!isImportDeclaration(statement)) continue;
    if (statement.source.value !== PACKAGE_NAME) continue;

    for (const specifier of statement.specifiers) {
      names.add(specifier.local.name);
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
export function collectDiBindings(sourceFile: SourceFile, seed: Set<string>): Set<string> {
  const bindings = new Set(seed);

  visit(sourceFile, (node) => {
    if (isVariableDeclarator(node) && node.init && isIdentifier(node.id)) {
      const root = getRootIdentifier(node.init);
      if (root && bindings.has(root)) {
        bindings.add(node.id.name);
      }
    }

    if (isAssignmentExpression(node) && node.operator === "=" && isIdentifier(node.left)) {
      const root = getRootIdentifier(node.right);
      if (root && bindings.has(root)) {
        bindings.add(node.left.name);
      }
    }
  });

  return bindings;
}

/**
 * Collects names that were imported as type-only (`import type { Foo }` or
 * `import { type Foo }`). With verbatimModuleSyntax enabled, interfaces and
 * type aliases *must* use one of these forms, making this a reliable signal
 * that the name has no runtime value.
 */
export function collectTypeOnlyImports(sourceFile: SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.program.body) {
    if (!isImportDeclaration(statement)) continue;

    for (const specifier of statement.specifiers) {
      const isTypeOnly =
        statement.importKind === "type" || (specifier.type === "ImportSpecifier" && specifier.importKind === "type");
      if (isTypeOnly) names.add(specifier.local.name);
    }
  }

  return names;
}

/**
 * Collects names of all interface and enum declarations in a single AST traversal.
 */
export function collectInterfaceAndEnumNames(sourceFile: SourceFile): {
  interfaceNames: Set<string>;
  enumNames: Set<string>;
} {
  const interfaceNames = new Set<string>();
  const enumNames = new Set<string>();

  visit(sourceFile, (node) => {
    if (isInterfaceDeclaration(node)) interfaceNames.add(node.id.name);
    else if (isEnumDeclaration(node)) enumNames.add(node.id.name);
  });

  return { interfaceNames, enumNames };
}

/**
 * Collects the names of all interface declarations in the source file.
 * Used to catch same-file interfaces passed to register<T>().
 */
export function collectInterfaceNames(sourceFile: SourceFile): Set<string> {
  return collectInterfaceAndEnumNames(sourceFile).interfaceNames;
}

/**
 * Collects the names of all enum declarations in the source file.
 * Used to catch same-file enums passed to register<T>().
 */
export function collectEnumNames(sourceFile: SourceFile): Set<string> {
  return collectInterfaceAndEnumNames(sourceFile).enumNames;
}

/**
 * Collects identifiers declared at the module top level via `function`, `const`/`let`/`var`,
 * or `class` statements. Used to detect shadowing of package imports by local declarations.
 */
export function collectLocalDeclarationNames(sourceFile: SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.program.body) {
    if (isFunctionDeclaration(statement) && statement.id) {
      names.add(statement.id.name);
    } else if (isVariableDeclaration(statement)) {
      for (const decl of statement.declarations) {
        if (isIdentifier(decl.id)) names.add(decl.id.name);
      }
    } else if (isClassDeclaration(statement) && statement.id) {
      names.add(statement.id.name);
    }
  }

  return names;
}

function importedLocalName(
  specifier: t.ImportSpecifier | t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier,
): string {
  return specifier.local.name;
}

/**
 * Builds a map from every locally-bound import name to its module specifier.
 * Unlike `collectImportedNames`, this covers ALL imports (not just those from
 * this package), so we can look up where any type argument comes from.
 */
export function collectTypeImportMap(sourceFile: SourceFile): Map<string, string> {
  const map = new Map<string, string>();

  for (const statement of sourceFile.program.body) {
    if (!isImportDeclaration(statement)) continue;

    for (const specifier of statement.specifiers) {
      map.set(importedLocalName(specifier), statement.source.value);
    }
  }

  return map;
}

export type SourceContext = {
  importedNames: Set<string>;
  filteredImportedNames: Set<string>;
  diBindings: Set<string>;
  localDeclarations: Set<string>;
  importMap: Map<string, string>;
  typeOnlyImports: Set<string>;
  interfaceNames: Set<string>;
  enumNames: Set<string>;
};

export function collectSourceContext(sourceFile: SourceFile): SourceContext {
  const importedNames = collectImportedNames(sourceFile);
  const localDeclarations = collectLocalDeclarationNames(sourceFile);
  const filteredImportedNames = new Set([...importedNames].filter((n) => !localDeclarations.has(n)));
  const diBindings = collectDiBindings(sourceFile, importedNames);
  const { interfaceNames, enumNames } = collectInterfaceAndEnumNames(sourceFile);

  return {
    importedNames,
    filteredImportedNames,
    diBindings,
    localDeclarations,
    importMap: collectTypeImportMap(sourceFile),
    typeOnlyImports: collectTypeOnlyImports(sourceFile),
    interfaceNames,
    enumNames,
  };
}
