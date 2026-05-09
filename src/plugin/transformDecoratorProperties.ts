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
 *   @resolve("my-id")
 *   public simple: SimpleService;    // with optional id
 *   →
 *   @resolve("/abs/path#SimpleService", SimpleService, "my-id")
 *   public simple: SimpleService;
 *
 *   @resolve()
 *   public logger: ILogger;          // interface — no runtime value
 *   →
 *   @resolve("/abs/path#ILogger", undefined)
 *   public logger: ILogger;
 *
 * The plugin always emits 2+ arguments so that `args.length >= 2` reliably
 * identifies already-transformed calls. Only `@resolve()` / `@resolve("id")`
 * calls where `resolve` is imported from this package are rewritten.
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

export const transformDecoratorProperties = (
  code: string,
  id: string,
  sourceFile: ts.SourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true),
): string => {

  const rawImportedNames = collectImportedNames(sourceFile);
  if (rawImportedNames.size === 0) return code;

  // Remove any imported names that are shadowed by a top-level local declaration.
  // A local `function resolve() {}` would shadow `import { resolve } from "..."` and
  // the decorator would refer to the local one — so we must not transform it.
  const localDeclarations = collectLocalDeclarationNames(sourceFile);
  const importedNames = new Set([...rawImportedNames].filter((n) => !localDeclarations.has(n)));
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

          // Skip if already transformed — the plugin always emits 2+ args
          if (decorator.expression.arguments.length >= 2) continue;

          // Extract the optional user-supplied id from the 1-arg form: @resolve("my-id")
          let userIdText: string | undefined;
          if (decorator.expression.arguments.length === 1) {
            const arg = decorator.expression.arguments[0];
            if (!ts.isStringLiteral(arg)) continue;
            userIdText = arg.getText(sourceFile);
          }

          const typeNode = node.type;
          if (!ts.isTypeReferenceNode(typeNode)) continue;

          const typeName = typeNode.getText(sourceFile);
          const bareTypeName = typeName.replace(/<.*>$/s, "").trim();
          const token = buildToken(typeName, importMap, id);

          const isConcrete =
            !typeOnlyImports.has(bareTypeName) && !interfaceNames.has(bareTypeName) && !enumNames.has(bareTypeName);

          // Always emit 2+ args: concrete type or `undefined` for interfaces
          const concreteArg = isConcrete ? bareTypeName : "undefined";
          const baseArgs = `"${token}", ${concreteArg}`;
          const args = userIdText ? `${baseArgs}, ${userIdText}` : baseArgs;

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
