/**
 * Injects `static __ducktionDependencies = ["token1", "token2", ...];` as the
 * first member of every non-abstract class that has a constructor with typed
 * parameters. The tokens are built with the same `buildToken` logic used by
 * `transformGenericCalls` so they resolve to the same runtime keys.
 *
 * Examples:
 *   class FooService {
 *     constructor(private logger: ILogger) {}
 *   }
 *   →
 *   class FooService {
 *     static __ducktionDependencies = ["/abs/path/to/src#ILogger"];
 *     constructor(private logger: ILogger) {}
 *   }
 *
 * Classes that already carry `__ducktionDependencies`, abstract classes, and
 * classes whose constructor has no parameters are left untouched.
 * Nested classes are handled correctly.
 */

import ts from "typescript";

import { buildToken } from "./buildToken";
import { collectTypeImportMap } from "./collectImports";

export const transformConstructorDependencies = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);
  const importMap = collectTypeImportMap(sourceFile);

  const insertions: Array<{ pos: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)) {
      const alreadyInjected = node.members.some(
        (m) => ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name) && m.name.text === "__ducktionDependencies",
      );

      if (!alreadyInjected) {
        const ctor = node.members.find(ts.isConstructorDeclaration);
        if (ctor && ctor.parameters.length > 0) {
          const tokens = ctor.parameters.map((param) => {
            const typeName = param.type ? param.type.getText(sourceFile) : "";
            if (!typeName) return '""';
            const token = buildToken(typeName, importMap, id);
            return JSON.stringify(token);
          });

          insertions.push({
            pos: node.members.pos,
            text: ` static __ducktionDependencies = [${tokens.join(", ")}];`,
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
