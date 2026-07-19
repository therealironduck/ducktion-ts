/**
 * Injects `static __ducktionDependencies = [{name, token}, ...];` as the
 * first member of every non-abstract class that has a constructor with typed
 * parameters. The tokens are built with the same `buildToken` logic used by
 * `transformGenericCalls` so they resolve to the same runtime keys.
 *
 * Each entry carries:
 *   - `name`  — the original parameter name as written in the constructor
 *   - `token` — the resolved dependency token string
 *
 * Examples:
 *   class FooService {
 *     constructor(private logger: ILogger) {}
 *   }
 *   →
 *   class FooService {
 *     static __ducktionDependencies = [{ name: "logger", token: "/abs/path/to/src#ILogger" }];
 *     constructor(private logger: ILogger) {}
 *   }
 *
 * Classes that already carry `__ducktionDependencies`, abstract classes, and
 * classes whose constructor has no parameters are left untouched.
 * Nested classes are handled correctly.
 */

import {
  isClassDeclaration,
  isClassProperty,
  isConstructor,
  isIdentifier,
  nodeStart,
  parseSourceFile,
  type SourceFile,
  visit,
} from "./ast";
import { collectSourceContext, type SourceContext } from "./collectImports";
import { buildParamEntry } from "./transformHelpers";

export const transformConstructorDependencies = (
  code: string,
  id: string,
  sourceFile: SourceFile = parseSourceFile(code, id),
  ctx: SourceContext = collectSourceContext(sourceFile),
): string => {
  const { importMap, typeOnlyImports, interfaceNames, enumNames, filteredImportedNames: importedNames } = ctx;

  const insertions: Array<{ pos: number; text: string }> = [];

  visit(sourceFile, (node) => {
    if (isClassDeclaration(node) && !node.abstract) {
      const alreadyInjected = node.body.body.some(
        (member) => isClassProperty(member) && isIdentifier(member.key) && member.key.name === "__ducktionDependencies",
      );

      if (!alreadyInjected) {
        // When constructor overloads are present, only the implementation
        // signature has a body. Pick that one; fall back to the first if none
        // has a body (plain constructor with no overloads).
        const ctors = node.body.body.filter(isConstructor);
        const ctor = ctors.find((c) => c.body !== undefined) ?? ctors[0];
        if (ctor && ctor.params.length > 0) {
          const entries = ctor.params.map((param) =>
            buildParamEntry(param, code, importedNames, importMap, id, typeOnlyImports, interfaceNames, enumNames),
          );

          insertions.push({
            pos: nodeStart(node.body) + 1,
            text: ` static __ducktionDependencies = [${entries.join(", ")}];`,
          });
        }
      }
    }
  });

  if (insertions.length === 0) {
    return code;
  }

  // Apply in reverse order so earlier positions stay valid.
  insertions.sort((a, b) => b.pos - a.pos);

  let result = code;
  for (const { pos, text } of insertions) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }

  return result;
};
