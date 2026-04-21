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

import { buildToken } from "./buildToken";
import {
  collectEnumNames,
  collectImportedNames,
  collectInterfaceNames,
  collectLocalDeclarationNames,
  collectTypeImportMap,
  collectTypeOnlyImports,
} from "./collectImports";

export const SCALAR_TOKEN = "ducktion__scalar";

const SCALAR_KINDS = new Set([
  ts.SyntaxKind.StringKeyword,
  ts.SyntaxKind.NumberKeyword,
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.BigIntKeyword,
  ts.SyntaxKind.SymbolKeyword,
  ts.SyntaxKind.NullKeyword,
  ts.SyntaxKind.UndefinedKeyword,
]);

function isScalarType(typeNode: ts.TypeNode): boolean {
  if (SCALAR_KINDS.has(typeNode.kind)) return true;
  // `null` is a LiteralTypeNode wrapping a NullKeyword literal, not a keyword type itself.
  if (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.NullKeyword) return true;
  return false;
}

/**
 * Returns the string value of a `@id("foo")` decorator on a constructor parameter,
 * or undefined if no such decorator is present (or `id` is not imported from our package).
 */
function extractIdDecoratorValue(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
): string | undefined {
  const decorators = ts.getDecorators(param);
  if (!decorators) return undefined;

  for (const decorator of decorators) {
    if (!ts.isCallExpression(decorator.expression)) continue;
    const callee = decorator.expression.expression;
    if (!ts.isIdentifier(callee)) continue;
    if (callee.text !== "id" || !importedNames.has("id")) continue;

    const args = decorator.expression.arguments;
    if (args.length !== 1) continue;
    const arg = args[0];
    if (!ts.isStringLiteral(arg)) continue;
    return arg.text;
  }

  return undefined;
}

export const transformConstructorDependencies = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);
  const importMap = collectTypeImportMap(sourceFile);
  const typeOnlyImports = collectTypeOnlyImports(sourceFile);
  const interfaceNames = collectInterfaceNames(sourceFile);
  const enumNames = collectEnumNames(sourceFile);

  const rawImportedNames = collectImportedNames(sourceFile);
  const localDeclarations = collectLocalDeclarationNames(sourceFile);
  const importedNames = new Set([...rawImportedNames].filter((n) => !localDeclarations.has(n)));

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
          const entries = ctor.parameters.map((param) => {
            const name = ts.isIdentifier(param.name) ? param.name.text : "";
            const paramId = extractIdDecoratorValue(param, sourceFile, importedNames);

            if (!param.type || isScalarType(param.type)) {
              const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";
              return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(SCALAR_TOKEN)}, concrete: undefined${idPart} }`;
            }

            const typeName = param.type.getText(sourceFile);
            const bareTypeName = typeName.replace(/<.*>$/s, "").trim();
            const token = buildToken(typeName, importMap, id);

            const isConcrete =
              !typeOnlyImports.has(bareTypeName) && !interfaceNames.has(bareTypeName) && !enumNames.has(bareTypeName);

            const concrete = isConcrete ? bareTypeName : "undefined";
            const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";

            return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(token)}, concrete: ${concrete}${idPart} }`;
          });

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
