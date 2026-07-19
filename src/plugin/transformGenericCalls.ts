/**
 * TypeScript erases generics, so `container.register<IMyService>()` compiles
 * down to `container.register()` — losing the type the DI container needs.
 * This transform rewrites those calls before erasure:
 *
 *   container.register<DebugLogger>()             →  container.__registerAs("pkg#DebugLogger", DebugLogger)
 *   container.resolve<DebugLogger>()              →  container.__resolveByToken("pkg#DebugLogger")
 *   container.registerAs<ILogger, DebugLogger>()  →  container.__registerAs("pkg#ILogger", DebugLogger)
 *   container.override<ILogger, DebugLogger>()    →  container.__override("pkg#ILogger", DebugLogger)
 *
 * Only calls on objects imported from this package are rewritten; same-named
 * methods on unrelated classes are left untouched.
 */

import type * as t from "@babel/types";

import { SCALAR_TOKEN } from "../constants";
import {
  bareTypeName,
  getLineAndCharacter,
  getText,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isNode,
  isScalarType,
  nodeEnd,
  nodeStart,
  parseSourceFile,
  type SourceFile,
  type TypeNode,
  visit,
} from "./ast";
import { buildToken } from "./buildToken";
import { collectSourceContext, getRootIdentifier, type SourceContext } from "./collectImports";

type TransformArgs = {
  typeArgs: readonly TypeNode[];
  code: string;
  importMap: Map<string, string>;
  fileId: string;
  typeOnlyImports: Set<string>;
  interfaceNames: Set<string>;
  enumNames: Set<string>;
  /** Raw text of the optional id argument, e.g. `"service1"`. Undefined when omitted. */
  idArgText?: string;
};

type MethodConfig = {
  replacementName: string;
  /** Minimum number of type arguments required; calls with fewer are skipped. */
  requiredTypeArgs: number;
  /**
   * When provided, called before buildArgs. Return a non-null error message to
   * replace the entire call expression with a runtime throw instead of the
   * normal rewrite — keeping the build green while surfacing a clear error at
   * the point of use.
   */
  buildRuntimeError?: (args: TransformArgs) => string | null;
  /**
   * When provided, overrides `replacementName` dynamically based on the call's
   * type arguments. Useful when the same generic method needs to resolve to
   * different runtime methods depending on whether T is a concrete class or an
   * interface/enum.
   */
  buildReplacementName?: (args: TransformArgs) => string;
  buildArgs: (args: TransformArgs) => string;
};

function getTypeArgs(node: t.CallExpression): readonly TypeNode[] {
  const call = node as unknown as { typeArguments?: unknown; typeParameters?: unknown };
  const typeArguments = call.typeParameters ?? call.typeArguments;
  if (isNode(typeArguments) && typeArguments.type === "TSTypeParameterInstantiation") {
    return (typeArguments as t.TSTypeParameterInstantiation).params;
  }
  return [];
}

/**
 * Validates that a type name refers to an instantiable class (not an interface, type alias, or enum).
 * Returns an error message string if invalid, or null if the type is acceptable.
 *
 * @param typeName     The bare type name to check (generic suffix already stripped).
 * @param method       The method name used in the error message (e.g. "register", "registerAs").
 * @param isTokenArg   True when the checked arg is the sole type arg of `register<T>()`, which
 *                     warrants a different error message that suggests `registerAs` as an alternative.
 */
function validateInstantiableType(
  typeName: string,
  method: string,
  isTokenArg: boolean,
  {
    typeOnlyImports,
    interfaceNames,
    enumNames,
  }: Pick<TransformArgs, "typeOnlyImports" | "interfaceNames" | "enumNames">,
): string | null {
  if (typeOnlyImports.has(typeName) || interfaceNames.has(typeName)) {
    if (isTokenArg) {
      return (
        `[ducktion-ts] Cannot use ${method}<${typeName}>() with an interface or type alias. ` +
        `Interfaces have no runtime value and cannot be instantiated. ` +
        `To map an interface to a concrete implementation use: registerAs<${typeName}, ConcreteImpl>()`
      );
    }
    return (
      `[ducktion-ts] Cannot use ${method}<Token, ${typeName}>() with an interface or type alias as the implementation. ` +
      `Interfaces have no runtime value and cannot be instantiated.`
    );
  }
  if (enumNames.has(typeName)) {
    if (isTokenArg) {
      return (
        `[ducktion-ts] Cannot use ${method}<${typeName}>() with an enum. ` +
        `Enums are not instantiable classes and cannot be registered as services.`
      );
    }
    return (
      `[ducktion-ts] Cannot use ${method}<Token, ${typeName}>() with an enum as the implementation. ` +
      `Enums are not instantiable classes and cannot be registered as services.`
    );
  }
  return null;
}

/**
 * Maps generic-call method names to their runtime replacements.
 * Add entries here to support additional transformations in the future.
 */
const METHOD_REPLACEMENTS: Record<string, MethodConfig> = {
  register: {
    replacementName: "__registerAs",
    requiredTypeArgs: 1,
    buildRuntimeError: ({ typeArgs, code, typeOnlyImports, interfaceNames, enumNames }) => {
      const typeName = bareTypeName(getText(code, typeArgs[0]));
      return validateInstantiableType(typeName, "register", true, { typeOnlyImports, interfaceNames, enumNames });
    },
    buildArgs: ({ typeArgs, code, importMap, fileId, idArgText }) => {
      const typeName = getText(code, typeArgs[0]);
      const token = buildToken(typeName, importMap, fileId);
      const base = `"${token}", ${typeName}`;
      return idArgText ? `${base}, ${idArgText}` : base;
    },
  },
  resolve: {
    replacementName: "__resolveByToken",
    requiredTypeArgs: 1,
    buildReplacementName: ({ typeArgs, code, typeOnlyImports, interfaceNames, enumNames }) => {
      if (isScalarType(typeArgs[0])) return "__resolveByToken";
      const typeName = bareTypeName(getText(code, typeArgs[0]));
      if (typeOnlyImports.has(typeName) || interfaceNames.has(typeName) || enumNames.has(typeName)) {
        return "__resolveByToken";
      }
      return "__resolveWithType";
    },
    buildArgs: ({ typeArgs, code, importMap, fileId, typeOnlyImports, interfaceNames, enumNames, idArgText }) => {
      if (isScalarType(typeArgs[0])) return idArgText ? `"${SCALAR_TOKEN}", ${idArgText}` : `"${SCALAR_TOKEN}"`;
      const typeName = getText(code, typeArgs[0]);
      const bareName = bareTypeName(typeName);
      const token = buildToken(typeName, importMap, fileId);
      if (typeOnlyImports.has(bareName) || interfaceNames.has(bareName) || enumNames.has(bareName)) {
        return idArgText ? `"${token}", ${idArgText}` : `"${token}"`;
      }
      const base = `"${token}", ${typeName}`;
      return idArgText ? `${base}, ${idArgText}` : base;
    },
  },
  registerAs: {
    replacementName: "__registerAs",
    requiredTypeArgs: 2,
    buildRuntimeError: ({ typeArgs, code, typeOnlyImports, interfaceNames, enumNames }) => {
      const implTypeName = bareTypeName(getText(code, typeArgs[1]));
      return validateInstantiableType(implTypeName, "registerAs", false, {
        typeOnlyImports,
        interfaceNames,
        enumNames,
      });
    },
    buildArgs: ({ typeArgs, code, importMap, fileId, idArgText }) => {
      const tokenTypeName = getText(code, typeArgs[0]);
      const implTypeName = getText(code, typeArgs[1]);
      const token = buildToken(tokenTypeName, importMap, fileId);
      const base = `"${token}", ${implTypeName}`;
      return idArgText ? `${base}, ${idArgText}` : base;
    },
  },
  override: {
    replacementName: "__override",
    requiredTypeArgs: 1,
    buildRuntimeError: ({ typeArgs, code, typeOnlyImports, interfaceNames, enumNames }) => {
      if (typeArgs.length < 2) return null;
      const implTypeName = bareTypeName(getText(code, typeArgs[1]));
      return validateInstantiableType(implTypeName, "override", false, { typeOnlyImports, interfaceNames, enumNames });
    },
    buildArgs: ({ typeArgs, code, importMap, fileId, idArgText }) => {
      const tokenTypeName = getText(code, typeArgs[0]);
      const token = buildToken(tokenTypeName, importMap, fileId);
      if (typeArgs.length < 2) {
        // No implementation: pass undefined so __override reuses the existing serviceType
        return idArgText ? `"${token}", undefined, ${idArgText}` : `"${token}"`;
      }
      const implTypeName = getText(code, typeArgs[1]);
      const base = `"${token}", ${implTypeName}`;
      return idArgText ? `${base}, ${idArgText}` : base;
    },
  },
};

export const transformGenericCalls = (
  code: string,
  id: string,
  sourceFile: SourceFile = parseSourceFile(code, id),
  ctx: SourceContext = collectSourceContext(sourceFile),
): string => {
  const { importedNames, diBindings, importMap, typeOnlyImports, interfaceNames, enumNames } = ctx;

  if (importedNames.size === 0) {
    return code;
  }

  const replacements: Array<{ start: number; end: number; text: string }> = [];

  visit(sourceFile, (node) => {
    if (isCallExpression(node) && isMemberExpression(node.callee) && isIdentifier(node.callee.property)) {
      const methodName = node.callee.property.name;
      const config = METHOD_REPLACEMENTS[methodName];
      const isValidArgCount = node.arguments.length <= 1;

      if (config !== undefined && isValidArgCount) {
        const root = getRootIdentifier(node.callee.object);
        if (root && diBindings.has(root)) {
          const typeArgs = getTypeArgs(node);

          if (typeArgs.length < config.requiredTypeArgs) {
            const { line, character } = getLineAndCharacter(code, nodeStart(node));
            throw new Error(
              `[ducktion-ts] ${id}:${line + 1}:${character + 1}: \`${methodName}()\` called without required type arguments. ` +
                `Did you mean \`${methodName}<${config.requiredTypeArgs === 1 ? "T" : "Token, Impl"}>()\`?`,
            );
          }

          const idArgText = node.arguments.length === 1 ? getText(code, node.arguments[0]) : undefined;
          const transformArgs: TransformArgs = {
            typeArgs,
            code,
            importMap,
            fileId: id,
            typeOnlyImports,
            interfaceNames,
            enumNames,
            idArgText,
          };

          const runtimeError = config.buildRuntimeError?.(transformArgs) ?? null;
          if (runtimeError) {
            replacements.push({
              start: nodeStart(node),
              end: nodeEnd(node),
              text: `(() => { throw new Error(${JSON.stringify(runtimeError)}); })()`,
            });
          } else {
            const replacementName = config.buildReplacementName?.(transformArgs) ?? config.replacementName;
            replacements.push({
              start: nodeStart(node.callee.property),
              end: nodeEnd(node),
              text: `${replacementName}(${config.buildArgs(transformArgs)})`,
            });
          }
        }
      }
    }
  });

  if (replacements.length === 0) {
    return code;
  }

  replacements.sort((a, b) => b.start - a.start);

  let result = code;
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end);
  }

  return result;
};
