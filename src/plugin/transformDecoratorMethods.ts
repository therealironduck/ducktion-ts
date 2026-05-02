/**
 * Detects methods decorated with bare `@resolve` and injects a static
 * `__ducktionResolveMethods` array into the containing class, so that
 * parameter type information survives TypeScript's type erasure.
 *
 * The container reads this array after instantiation and calls each listed
 * method with its resolved dependencies injected as arguments.
 *
 *   class Foo {
 *     @resolve
 *     public init(logger: ILogger, db: DbService) { ... }
 *   }
 *   →
 *   class Foo {
 *     static __ducktionResolveMethods = [
 *       { methodKey: "init", dependencies: [
 *         { name: "logger", token: ".../logger#ILogger", concrete: undefined },
 *         { name: "db",     token: ".../db#DbService",  concrete: DbService  },
 *       ]},
 *     ];
 *     @resolve
 *     public init(logger: ILogger, db: DbService) { ... }
 *   }
 *
 * Classes that already carry `__ducktionResolveMethods`, abstract classes,
 * and methods without a bare `@resolve` decorator are left untouched.
 * Only `@resolve` imported from this package is rewritten; same-named
 * identifiers from other sources are ignored.
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

function isScalarType(typeNode: ts.TypeNode): boolean {
  if (SCALAR_KINDS.has(typeNode.kind)) return true;
  if (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.NullKeyword) return true;
  return false;
}

function extractDecoratorStringArg(
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

function extractIdDecoratorValue(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
): string | undefined {
  return extractDecoratorStringArg(param, sourceFile, importedNames, "id");
}

function extractResolveTagsDecoratorValue(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile,
  importedNames: Set<string>,
): string | undefined {
  return extractDecoratorStringArg(param, sourceFile, importedNames, "resolveTags");
}

export const transformDecoratorMethods = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);

  const rawImportedNames = collectImportedNames(sourceFile);
  if (rawImportedNames.size === 0) return code;

  const localDeclarations = collectLocalDeclarationNames(sourceFile);
  const importedNames = new Set([...rawImportedNames].filter((n) => !localDeclarations.has(n)));
  if (importedNames.size === 0) return code;

  const importMap = collectTypeImportMap(sourceFile);
  const typeOnlyImports = collectTypeOnlyImports(sourceFile);
  const interfaceNames = collectInterfaceNames(sourceFile);
  const enumNames = collectEnumNames(sourceFile);

  const insertions: Array<{ pos: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)) {
      const alreadyInjected = node.members.some(
        (m) => ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name) && m.name.text === "__ducktionResolveMethods",
      );

      if (!alreadyInjected) {
        const methodEntries: string[] = [];

        for (const member of node.members) {
          if (!ts.isMethodDeclaration(member)) continue;

          const decorators = ts.getDecorators(member);
          if (!decorators) continue;

          // Only bare `@resolve` (identifier, not a call expression)
          const hasResolveDecorator = decorators.some(
            (d) =>
              ts.isIdentifier(d.expression) && d.expression.text === "resolve" && importedNames.has(d.expression.text),
          );

          if (!hasResolveDecorator) continue;

          const methodName = ts.isIdentifier(member.name) ? member.name.text : null;
          if (!methodName) continue;

          const deps = member.parameters.map((param) => {
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
            const token = buildToken(typeName, importMap, id);

            const isConcrete =
              !typeOnlyImports.has(bareTypeName) && !interfaceNames.has(bareTypeName) && !enumNames.has(bareTypeName);

            const concrete = isConcrete ? bareTypeName : "undefined";
            const idPart = paramId ? `, id: ${JSON.stringify(paramId)}` : "";

            return `{ name: ${JSON.stringify(name)}, token: ${JSON.stringify(token)}, concrete: ${concrete}${idPart} }`;
          });

          methodEntries.push(`{ methodKey: ${JSON.stringify(methodName)}, dependencies: [${deps.join(", ")}] }`);
        }

        if (methodEntries.length > 0) {
          insertions.push({
            pos: node.members.pos,
            text: ` static __ducktionResolveMethods = [${methodEntries.join(", ")}];`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (insertions.length === 0) return code;

  insertions.sort((a, b) => b.pos - a.pos);

  let result = code;
  for (const { pos, text } of insertions) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }

  return result;
};
