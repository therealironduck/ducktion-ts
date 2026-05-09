/**
 * Detects methods decorated with bare `@resolve` and injects a static
 * `__ducktionResolveMethods` array into the containing class, so that
 * parameter type information survives TypeScript's type erasure.
 *
 * The container reads this array after instantiation and calls each listed
 * method with its resolved dependencies injected as arguments.
 *
 *   class Foo {
 *     @resolve
 *     public init(logger: ILogger, db: DbService) { ... }
 *   }
 *   →
 *   class Foo {
 *     static __ducktionResolveMethods = [
 *       { methodKey: "init", dependencies: [
 *         { name: "logger", token: ".../logger#ILogger", concrete: undefined },
 *         { name: "db",     token: ".../db#DbService",  concrete: DbService  },
 *       ]},
 *     ];
 *     @resolve
 *     public init(logger: ILogger, db: DbService) { ... }
 *   }
 *
 * Classes that already carry `__ducktionResolveMethods`, abstract classes,
 * and methods without a bare `@resolve` decorator are left untouched.
 * Only `@resolve` imported from this package is rewritten; same-named
 * identifiers from other sources are ignored.
 */

import ts from "typescript";

import { collectSourceContext, type SourceContext } from "./collectImports";
import { buildParamEntry } from "./transformHelpers";

export const transformDecoratorMethods = (
  code: string,
  id: string,
  sourceFile: ts.SourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true),
  ctx: SourceContext = collectSourceContext(sourceFile),
): string => {
  const {
    importedNames: rawImportedNames,
    filteredImportedNames: importedNames,
    importMap,
    typeOnlyImports,
    interfaceNames,
    enumNames,
  } = ctx;

  if (rawImportedNames.size === 0) return code;
  if (importedNames.size === 0) return code;

  const insertions: Array<{ pos: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)) {
      const alreadyInjected = node.members.some(
        (m) => ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name) && m.name.text === "__ducktionResolveMethods",
      );

      if (!alreadyInjected) {
        const methodEntries: string[] = [];

        for (const member of node.members) {
          if (!ts.isMethodDeclaration(member)) continue;

          const decorators = ts.getDecorators(member);
          if (!decorators) continue;

          // Only bare `@resolve` (identifier, not a call expression)
          const hasResolveDecorator = decorators.some(
            (d) =>
              ts.isIdentifier(d.expression) && d.expression.text === "resolve" && importedNames.has(d.expression.text),
          );

          if (!hasResolveDecorator) continue;

          const methodName = ts.isIdentifier(member.name) ? member.name.text : null;
          if (!methodName) continue;

          const deps = member.parameters.map((param) =>
            buildParamEntry(
              param,
              sourceFile,
              importedNames,
              importMap,
              id,
              typeOnlyImports,
              interfaceNames,
              enumNames,
            ),
          );

          methodEntries.push(`{ methodKey: ${JSON.stringify(methodName)}, dependencies: [${deps.join(", ")}] }`);
        }

        if (methodEntries.length > 0) {
          insertions.push({
            pos: node.members.pos,
            text: ` static __ducktionResolveMethods = [${methodEntries.join(", ")}];`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (insertions.length === 0) return code;

  insertions.sort((a, b) => b.pos - a.pos);

  let result = code;
  for (const { pos, text } of insertions) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }

  return result;
};
