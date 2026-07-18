import { SCALAR_TOKEN } from "../constants";
import {
  bareTypeName,
  getText,
  isCallExpression,
  isIdentifier,
  isScalarType,
  isStringLiteral,
  parameterDecorators,
  parameterName,
  parameterType,
  type Parameter,
} from "./ast";
import { buildToken } from "./buildToken";

export function extractDecoratorStringArg(
  param: Parameter,
  importedNames: Set<string>,
  decoratorName: string,
): string | undefined {
  const decorators = parameterDecorators(param);
  if (!decorators) return undefined;

  for (const decorator of decorators) {
    if (!isCallExpression(decorator.expression)) continue;
    const callee = decorator.expression.callee;
    if (!isIdentifier(callee)) continue;
    if (callee.name !== decoratorName || !importedNames.has(decoratorName)) continue;

    const args = decorator.expression.arguments;
    if (args.length !== 1) continue;
    const arg = args[0];
    if (!isStringLiteral(arg)) continue;
    return arg.value;
  }

  return undefined;
}

export function extractIdDecoratorValue(param: Parameter, importedNames: Set<string>): string | undefined {
  return extractDecoratorStringArg(param, importedNames, "id");
}

export function extractResolveTagsDecoratorValue(param: Parameter, importedNames: Set<string>): string | undefined {
  return extractDecoratorStringArg(param, importedNames, "resolveTags");
}

/**
 * Converts a single constructor/method parameter declaration into its
 * `__ducktionDependencies` / `__ducktionResolveMethods` entry string.
 */
export function buildParamEntry(
  param: Parameter,
  code: string,
  importedNames: Set<string>,
  importMap: Map<string, string>,
  fileId: string,
  typeOnlyImports: Set<string>,
  interfaceNames: Set<string>,
  enumNames: Set<string>,
): string {
  const name = parameterName(param);
  const resolveTag = extractResolveTagsDecoratorValue(param, importedNames);

  if (resolveTag !== undefined) {
    return `{ name: ${JSON.stringify(name)}, token: "ducktion__tag", tag: ${JSON.stringify(resolveTag)} }`;
  }

  const paramId = extractIdDecoratorValue(param, importedNames);
  const typeNode = parameterType(param);

  if (!typeNode || isScalarType(typeNode)) {
    const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";
    return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(SCALAR_TOKEN)}, concrete: undefined${idPart} }`;
  }

  const typeName = getText(code, typeNode);
  const bareName = bareTypeName(typeName);
  const token = buildToken(typeName, importMap, fileId);

  const isConcrete = !typeOnlyImports.has(bareName) && !interfaceNames.has(bareName) && !enumNames.has(bareName);

  const concrete = isConcrete ? bareName : "undefined";
  const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";

  return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(token)}, concrete: ${concrete}${idPart} }`;
}
