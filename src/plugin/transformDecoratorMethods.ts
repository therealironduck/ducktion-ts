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

import {
  isClassDeclaration,
  isClassProperty,
  isIdentifier,
  isMethod,
  nodeStart,
  parseSourceFile,
  type SourceFile,
  visit,
} from "./ast";
import { collectSourceContext, type SourceContext } from "./collectImports";
import { buildParamEntry } from "./transformHelpers";

export const transformDecoratorMethods = (
  code: string,
  id: string,
  sourceFile: SourceFile = parseSourceFile(code, id),
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

  visit(sourceFile, (node) => {
    if (isClassDeclaration(node) && !node.abstract) {
      const alreadyInjected = node.body.body.some(
        (member) =>
          isClassProperty(member) && isIdentifier(member.key) && member.key.name === "__ducktionResolveMethods",
      );

      if (!alreadyInjected) {
        const methodEntries: string[] = [];

        for (const member of node.body.body) {
          if (!isMethod(member)) continue;

          const decorators = member.decorators;
          if (!decorators) continue;

          // Only bare `@resolve` (identifier, not a call expression)
          const hasResolveDecorator = decorators.some(
            (decorator) =>
              isIdentifier(decorator.expression) &&
              decorator.expression.name === "resolve" &&
              importedNames.has(decorator.expression.name),
          );

          if (!hasResolveDecorator) continue;

          const methodName = isIdentifier(member.key) ? member.key.name : null;
          if (!methodName) continue;

          const deps = member.params.map((param) =>
            buildParamEntry(param, code, importedNames, importMap, id, typeOnlyImports, interfaceNames, enumNames),
          );

          methodEntries.push(`{ methodKey: ${JSON.stringify(methodName)}, dependencies: [${deps.join(", ")}] }`);
        }

        if (methodEntries.length > 0) {
          insertions.push({
            pos: nodeStart(node.body) + 1,
            text: ` static __ducktionResolveMethods = [${methodEntries.join(", ")}];`,
          });
        }
      }
    }
  });

  if (insertions.length === 0) return code;

  insertions.sort((a, b) => b.pos - a.pos);

  let result = code;
  for (const { pos, text } of insertions) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }

  return result;
};
