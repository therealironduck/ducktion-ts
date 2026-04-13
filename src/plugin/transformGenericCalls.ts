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

import ts from "typescript";

import { buildToken } from "./buildToken";
import {
  collectDiBindings,
  collectEnumNames,
  collectImportedNames,
  collectInterfaceNames,
  collectTypeImportMap,
  collectTypeOnlyImports,
  getRootIdentifier,
} from "./collectImports";
import { SCALAR_TOKEN } from "./transformConstructorDependencies";

const SCALAR_KINDS = new Set([
  ts.SyntaxKind.StringKeyword,
  ts.SyntaxKind.NumberKeyword,
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.BigIntKeyword,
  ts.SyntaxKind.SymbolKeyword,
  ts.SyntaxKind.NullKeyword,
  ts.SyntaxKind.UndefinedKeyword,
]);

function isScalarTypeArg(node: ts.TypeNode): boolean {
  if (SCALAR_KINDS.has(node.kind)) return true;
  // `null` in type position is a LiteralTypeNode wrapping NullKeyword, not a keyword node itself
  if (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword) return true;
  return false;
}

type TransformArgs = {
  typeArgs: ts.NodeArray<ts.TypeNode>;
  sourceFile: ts.SourceFile;
  importMap: Map<string, string>;
  fileId: string;
  typeOnlyImports: Set<string>;
  interfaceNames: Set<string>;
  enumNames: Set<string>;
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
    buildRuntimeError: ({ typeArgs, sourceFile, typeOnlyImports, interfaceNames, enumNames }) => {
      const typeName = typeArgs[0].getText(sourceFile).replace(/<.*>$/s, "").trim();
      return validateInstantiableType(typeName, "register", true, { typeOnlyImports, interfaceNames, enumNames });
    },
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId }) => {
      const typeName = typeArgs[0].getText(sourceFile);
      const token = buildToken(typeName, importMap, fileId);
      return `"${token}", ${typeName}`;
    },
  },
  resolve: {
    replacementName: "__resolveByToken",
    requiredTypeArgs: 1,
    buildReplacementName: ({ typeArgs, sourceFile, typeOnlyImports, interfaceNames, enumNames }) => {
      if (isScalarTypeArg(typeArgs[0])) return "__resolveByToken";
      const typeName = typeArgs[0].getText(sourceFile).replace(/<.*>$/s, "").trim();
      if (typeOnlyImports.has(typeName) || interfaceNames.has(typeName) || enumNames.has(typeName)) {
        return "__resolveByToken";
      }
      return "__resolveWithType";
    },
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId, typeOnlyImports, interfaceNames, enumNames }) => {
      if (isScalarTypeArg(typeArgs[0])) return `"${SCALAR_TOKEN}"`;
      const typeName = typeArgs[0].getText(sourceFile);
      const bareTypeName = typeName.replace(/<.*>$/s, "").trim();
      const token = buildToken(typeName, importMap, fileId);
      if (typeOnlyImports.has(bareTypeName) || interfaceNames.has(bareTypeName) || enumNames.has(bareTypeName)) {
        return `"${token}"`;
      }
      return `"${token}", ${typeName}`;
    },
  },
  registerAs: {
    replacementName: "__registerAs",
    requiredTypeArgs: 2,
    buildRuntimeError: ({ typeArgs, sourceFile, typeOnlyImports, interfaceNames, enumNames }) => {
      const implTypeName = typeArgs[1].getText(sourceFile).replace(/<.*>$/s, "").trim();
      return validateInstantiableType(implTypeName, "registerAs", false, {
        typeOnlyImports,
        interfaceNames,
        enumNames,
      });
    },
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId }) => {
      const tokenTypeName = typeArgs[0].getText(sourceFile);
      const implTypeName = typeArgs[1].getText(sourceFile);
      const token = buildToken(tokenTypeName, importMap, fileId);
      return `"${token}", ${implTypeName}`;
    },
  },
  override: {
    replacementName: "__override",
    requiredTypeArgs: 2,
    buildRuntimeError: ({ typeArgs, sourceFile, typeOnlyImports, interfaceNames, enumNames }) => {
      const implTypeName = typeArgs[1].getText(sourceFile).replace(/<.*>$/s, "").trim();
      return validateInstantiableType(implTypeName, "override", false, { typeOnlyImports, interfaceNames, enumNames });
    },
    buildArgs: ({ typeArgs, sourceFile, importMap, fileId }) => {
      const tokenTypeName = typeArgs[0].getText(sourceFile);
      const implTypeName = typeArgs[1].getText(sourceFile);
      const token = buildToken(tokenTypeName, importMap, fileId);
      return `"${token}", ${implTypeName}`;
    },
  },
};

export const transformGenericCalls = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);

  const importedNames = collectImportedNames(sourceFile);
  if (importedNames.size === 0) {
    return code;
  }

  const diBindings = collectDiBindings(sourceFile, importedNames);
  const importMap = collectTypeImportMap(sourceFile);
  const typeOnlyImports = collectTypeOnlyImports(sourceFile);
  const interfaceNames = collectInterfaceNames(sourceFile);
  const enumNames = collectEnumNames(sourceFile);

  const replacements: Array<{ start: number; end: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      node.typeArguments &&
      node.typeArguments.length > 0 &&
      node.arguments.length === 0 &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const methodName = node.expression.name.text;
      const config = METHOD_REPLACEMENTS[methodName];
      if (config !== undefined && node.typeArguments.length >= config.requiredTypeArgs) {
        const root = getRootIdentifier(node.expression.expression);
        if (root && diBindings.has(root)) {
          const transformArgs: TransformArgs = {
            typeArgs: node.typeArguments,
            sourceFile,
            importMap,
            fileId: id,
            typeOnlyImports,
            interfaceNames,
            enumNames,
          };

          const runtimeError = config.buildRuntimeError?.(transformArgs) ?? null;
          if (runtimeError) {
            replacements.push({
              start: node.getStart(sourceFile),
              end: node.end,
              text: `(() => { throw new Error(${JSON.stringify(runtimeError)}); })()`,
            });
          } else {
            const replacementName = config.buildReplacementName?.(transformArgs) ?? config.replacementName;
            replacements.push({
              start: node.expression.name.getStart(sourceFile),
              end: node.end,
              text: `${replacementName}(${config.buildArgs(transformArgs)})`,
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

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
