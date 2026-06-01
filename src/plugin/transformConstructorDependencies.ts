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

import ts from "typescript";

import { collectSourceContext, type SourceContext } from "./collectImports";
import { buildParamEntry } from "./transformHelpers";

export const transformConstructorDependencies = (
  code: string,
  id: string,
  sourceFile: ts.SourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true),
  ctx: SourceContext = collectSourceContext(sourceFile),
): string => {
  const { importMap, typeOnlyImports, interfaceNames, enumNames, filteredImportedNames: importedNames } = ctx;

  const insertions: Array<{ pos: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)) {
      const alreadyInjected = node.members.some(
        (m) => ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name) && m.name.text === "__ducktionDependencies",
      );

      if (!alreadyInjected) {
        // When constructor overloads are present, only the implementation
        // signature has a body. Pick that one; fall back to the first if none
        // has a body (plain constructor with no overloads).
        const ctors = node.members.filter(ts.isConstructorDeclaration);
        const ctor = ctors.find((c) => c.body !== undefined) ?? ctors[0];
        if (ctor && ctor.parameters.length > 0) {
          const entries = ctor.parameters.map((param) =>
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

          insertions.push({
            pos: node.members.pos,
            text: ` static __ducktionDependencies = [${entries.join(", ")}];`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

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
