import type { ParserPlugin } from "@babel/parser";
import type * as t from "@babel/types";

import { parse } from "@babel/parser";

export type SourceFile = t.File;
export type AstNode = t.Node;
export type TypeNode = t.TSType;
export type ClassMember = t.ClassBody["body"][number];
export type Parameter = t.FunctionParameter | t.TSParameterProperty;

const PARSE_PLUGINS: ParserPlugin[] = ["decorators-legacy", "typescript"];

export function parseSourceFile(code: string, id: string): SourceFile {
  return parse(code, {
    sourceFilename: id,
    sourceType: "module",
    plugins: PARSE_PLUGINS,
  });
}

export function nodeStart(node: Pick<t.Node, "start">): number {
  if (node.start === null || node.start === undefined) {
    throw new Error("[ducktion-ts] Parser node is missing a start position.");
  }
  return node.start;
}

export function nodeEnd(node: Pick<t.Node, "end">): number {
  if (node.end === null || node.end === undefined) {
    throw new Error("[ducktion-ts] Parser node is missing an end position.");
  }
  return node.end;
}

export function getText(code: string, node: Pick<t.Node, "start" | "end">): string {
  return code.slice(nodeStart(node), nodeEnd(node));
}

export function getLineAndCharacter(code: string, position: number): { line: number; character: number } {
  const before = code.slice(0, position);
  const lines = before.split(/\r\n|\r|\n/);
  return { line: lines.length - 1, character: lines.at(-1)?.length ?? 0 };
}

export function visit(node: AstNode, cb: (node: AstNode) => void): void {
  cb(node);

  const record = node as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (
      key === "loc" ||
      key === "start" ||
      key === "end" ||
      key === "extra" ||
      key === "leadingComments" ||
      key === "innerComments" ||
      key === "trailingComments"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) visit(item, cb);
      }
    } else if (isNode(value)) {
      visit(value, cb);
    }
  }
}

export function isNode(value: unknown): value is AstNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

export function isIdentifier(node: unknown): node is t.Identifier {
  return isNode(node) && node.type === "Identifier";
}

export function isStringLiteral(node: unknown): node is t.StringLiteral {
  return isNode(node) && node.type === "StringLiteral";
}

export function isImportDeclaration(node: AstNode): node is t.ImportDeclaration {
  return node.type === "ImportDeclaration";
}

export function isClassDeclaration(node: AstNode): node is t.ClassDeclaration {
  return node.type === "ClassDeclaration";
}

export function isClassProperty(node: unknown): node is t.ClassProperty {
  return isNode(node) && node.type === "ClassProperty";
}

export function isClassMethod(node: unknown): node is t.ClassMethod {
  return isNode(node) && node.type === "ClassMethod";
}

export function isConstructor(member: ClassMember): member is t.ClassMethod {
  return isClassMethod(member) && member.kind === "constructor";
}

export function isMethod(member: ClassMember): member is t.ClassMethod {
  return isClassMethod(member) && member.kind === "method";
}

export function isCallExpression(node: unknown): node is t.CallExpression {
  return isNode(node) && node.type === "CallExpression";
}

export function isMemberExpression(node: unknown): node is t.MemberExpression {
  return isNode(node) && node.type === "MemberExpression";
}

export function isAssignmentExpression(node: AstNode): node is t.AssignmentExpression {
  return node.type === "AssignmentExpression";
}

export function isVariableDeclarator(node: AstNode): node is t.VariableDeclarator {
  return node.type === "VariableDeclarator";
}

export function isInterfaceDeclaration(node: AstNode): node is t.TSInterfaceDeclaration {
  return node.type === "TSInterfaceDeclaration";
}

export function isEnumDeclaration(node: AstNode): node is t.TSEnumDeclaration {
  return node.type === "TSEnumDeclaration";
}

export function isFunctionDeclaration(node: AstNode): node is t.FunctionDeclaration {
  return node.type === "FunctionDeclaration";
}

export function isVariableDeclaration(node: AstNode): node is t.VariableDeclaration {
  return node.type === "VariableDeclaration";
}

export function isTypeReference(node: TypeNode): node is t.TSTypeReference {
  return node.type === "TSTypeReference";
}

export function parameterNode(param: Parameter): t.FunctionParameter {
  return param.type === "TSParameterProperty" ? param.parameter : param;
}

export function parameterDecorators(param: Parameter): readonly t.Decorator[] | undefined {
  if (param.type === "TSParameterProperty") return param.decorators ?? undefined;

  const node = parameterNode(param);
  return "decorators" in node ? (node.decorators ?? undefined) : undefined;
}

export function parameterName(param: Parameter): string {
  const node = parameterNode(param);
  return isIdentifier(node) ? node.name : "";
}

export function parameterType(param: Parameter): TypeNode | undefined {
  const node = parameterNode(param);
  return "typeAnnotation" in node && node.typeAnnotation?.type === "TSTypeAnnotation"
    ? node.typeAnnotation.typeAnnotation
    : undefined;
}

export function typeReferenceName(code: string, node: t.TSTypeReference): string {
  return getText(code, node.typeName);
}

export function bareTypeName(typeName: string): string {
  return typeName.replace(/<.*>$/s, "").trim();
}

export function isScalarType(node: TypeNode): boolean {
  return (
    node.type === "TSStringKeyword" ||
    node.type === "TSNumberKeyword" ||
    node.type === "TSBooleanKeyword" ||
    node.type === "TSBigIntKeyword" ||
    node.type === "TSSymbolKeyword" ||
    node.type === "TSNullKeyword" ||
    node.type === "TSUndefinedKeyword"
  );
}
