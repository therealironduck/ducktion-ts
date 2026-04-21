/**
 * Rewrites `@resolve()` decorator calls on class properties so that the type
 * information survives TypeScript erasure:
 *
 *   @resolve()
 *   public simple: SimpleService;
 *   →
 *   @resolve("/abs/path#SimpleService", SimpleService)
 *   public simple: SimpleService;
 *
 *   @resolve()
 *   public logger: ILogger;          // interface — no runtime value
 *   →
 *   @resolve("/abs/path#ILogger")
 *   public logger: ILogger;
 *
 * Only `@resolve()` calls with zero arguments that are imported from this
 * package are rewritten; decorated properties that already carry arguments
 * are left untouched.
 */

import ts from "typescript";

import { buildToken } from "./buildToken";
import {
  collectEnumNames,
  collectImportedNames,
  collectInterfaceNames,
  collectTypeImportMap,
  collectTypeOnlyImports,
} from "./collectImports";

export const transformDecoratorProperties = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);

  const importedNames = collectImportedNames(sourceFile);
  if (importedNames.size === 0) return code;

  const importMap = collectTypeImportMap(sourceFile);
  const typeOnlyImports = collectTypeOnlyImports(sourceFile);
  const interfaceNames = collectInterfaceNames(sourceFile);
  const enumNames = collectEnumNames(sourceFile);

  const replacements: Array<{ start: number; end: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isPropertyDeclaration(node) && node.type) {
      const decorators = ts.getDecorators(node);

      if (decorators) {
        for (const decorator of decorators) {
          if (!ts.isCallExpression(decorator.expression)) continue;

          const callee = decorator.expression.expression;
          if (!ts.isIdentifier(callee)) continue;
          if (callee.text !== "resolve" || !importedNames.has(callee.text)) continue;

          // Skip if the user already provided arguments manually
          if (decorator.expression.arguments.length > 0) continue;

          const typeNode = node.type;
          if (!ts.isTypeReferenceNode(typeNode)) continue;

          const typeName = typeNode.getText(sourceFile);
          const bareTypeName = typeName.replace(/<.*>$/s, "").trim();
          const token = buildToken(typeName, importMap, id);

          const isConcrete =
            !typeOnlyImports.has(bareTypeName) && !interfaceNames.has(bareTypeName) && !enumNames.has(bareTypeName);

          const args = isConcrete ? `"${token}", ${bareTypeName}` : `"${token}"`;

          replacements.push({
            start: decorator.expression.getStart(sourceFile),
            end: decorator.expression.end,
            text: `resolve(${args})`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (replacements.length === 0) return code;

  replacements.sort((a, b) => b.start - a.start);

  let result = code;
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end);
  }

  return result;
};
