import ts from "typescript";

import { buildToken } from "./buildToken";
import { SCALAR_TOKEN } from "./transformConstructorDependencies";

export const SCALAR_KINDS = new Set([
  ts.SyntaxKind.StringKeyword,
  ts.SyntaxKind.NumberKeyword,
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.BigIntKeyword,
  ts.SyntaxKind.SymbolKeyword,
  ts.SyntaxKind.NullKeyword,
  ts.SyntaxKind.UndefinedKeyword,
]);

export function isScalarType(typeNode: ts.TypeNode): boolean {
  if (SCALAR_KINDS.has(typeNode.kind)) return true;
  // `null` is a LiteralTypeNode wrapping a NullKeyword literal, not a keyword type itself.
  if (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.NullKeyword) return true;
  return false;
}

export function extractDecoratorStringArg(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
  decoratorName: string,
): string | undefined {
  const decorators = ts.getDecorators(param);
  if (!decorators) return undefined;

  for (const decorator of decorators) {
    if (!ts.isCallExpression(decorator.expression)) continue;
    const callee = decorator.expression.expression;
    if (!ts.isIdentifier(callee)) continue;
    if (callee.text !== decoratorName || !importedNames.has(decoratorName)) continue;

    const args = decorator.expression.arguments;
    if (args.length !== 1) continue;
    const arg = args[0];
    if (!ts.isStringLiteral(arg)) continue;
    return arg.text;
  }

  return undefined;
}

export function extractIdDecoratorValue(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
): string | undefined {
  return extractDecoratorStringArg(param, sourceFile, importedNames, "id");
}

export function extractResolveTagsDecoratorValue(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
): string | undefined {
  return extractDecoratorStringArg(param, sourceFile, importedNames, "resolveTags");
}

/**
 * Converts a single constructor/method parameter declaration into its
 * `__ducktionDependencies` / `__ducktionResolveMethods` entry string.
 */
export function buildParamEntry(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
  importMap: Map<string, string>,
  fileId: string,
  typeOnlyImports: Set<string>,
  interfaceNames: Set<string>,
  enumNames: Set<string>,
): string {
  const name = ts.isIdentifier(param.name) ? param.name.text : "";
  const resolveTag = extractResolveTagsDecoratorValue(param, sourceFile, importedNames);

  if (resolveTag !== undefined) {
    return `{ name: ${JSON.stringify(name)}, token: "ducktion__tag", tag: ${JSON.stringify(resolveTag)} }`;
  }

  const paramId = extractIdDecoratorValue(param, sourceFile, importedNames);

  if (!param.type || isScalarType(param.type)) {
    const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";
    return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(SCALAR_TOKEN)}, concrete: undefined${idPart} }`;
  }

  const typeName = param.type.getText(sourceFile);
  const bareTypeName = typeName.replace(/<.*>$/s, "").trim();
  const token = buildToken(typeName, importMap, fileId);

  const isConcrete =
    !typeOnlyImports.has(bareTypeName) && !interfaceNames.has(bareTypeName) && !enumNames.has(bareTypeName);

  const concrete = isConcrete ? bareTypeName : "undefined";
  const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";

  return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(token)}, concrete: ${concrete}${idPart} }`;
}
