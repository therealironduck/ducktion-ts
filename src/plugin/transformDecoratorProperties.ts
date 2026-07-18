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

import {
  bareTypeName,
  getText,
  isCallExpression,
  isClassProperty,
  isIdentifier,
  isStringLiteral,
  isTypeReference,
  nodeEnd,
  nodeStart,
  parseSourceFile,
  type SourceFile,
  visit,
} from "./ast";
import { buildToken } from "./buildToken";
import { collectSourceContext, type SourceContext } from "./collectImports";

export const transformDecoratorProperties = (
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

  const replacements: Array<{ start: number; end: number; text: string }> = [];

  visit(sourceFile, (node) => {
    if (isClassProperty(node) && node.typeAnnotation?.type === "TSTypeAnnotation") {
      const decorators = node.decorators;

      if (decorators) {
        for (const decorator of decorators) {
          if (!isCallExpression(decorator.expression)) continue;

          const callee = decorator.expression.callee;
          if (!isIdentifier(callee)) continue;
          if (callee.name !== "resolve" || !importedNames.has(callee.name)) continue;

          // Skip if already transformed — the plugin always emits 2+ args
          if (decorator.expression.arguments.length >= 2) continue;

          // Extract the optional user-supplied id from the 1-arg form: @resolve("my-id")
          let userIdText: string | undefined;
          if (decorator.expression.arguments.length === 1) {
            const arg = decorator.expression.arguments[0];
            if (!isStringLiteral(arg)) continue;
            userIdText = getText(code, arg);
          }

          const typeNode = node.typeAnnotation.typeAnnotation;
          if (!isTypeReference(typeNode)) continue;

          const typeName = getText(code, typeNode);
          const bareName = bareTypeName(typeName);
          const token = buildToken(typeName, importMap, id);

          const isConcrete =
            !typeOnlyImports.has(bareName) && !interfaceNames.has(bareName) && !enumNames.has(bareName);

          // Always emit 2+ args: concrete type or `undefined` for interfaces
          const concreteArg = isConcrete ? bareName : "undefined";
          const baseArgs = `"${token}", ${concreteArg}`;
          const args = userIdText ? `${baseArgs}, ${userIdText}` : baseArgs;

          replacements.push({
            start: nodeStart(decorator.expression),
            end: nodeEnd(decorator.expression),
            text: `resolve(${args})`,
          });
        }
      }
    }
  });

  if (replacements.length === 0) return code;

  replacements.sort((a, b) => b.start - a.start);

  let result = code;
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end);
  }

  return result;
};
