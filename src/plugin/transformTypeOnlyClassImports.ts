import type * as t from "@babel/types";

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { isClassDeclaration, isImportDeclaration, nodeEnd, nodeStart, parseSourceFile, type SourceFile } from "./ast";

function resolveLocalModule(fileId: string, source: string): string | undefined {
  if (!source.startsWith(".")) return undefined;

  const base = path.resolve(path.dirname(fileId), source);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }

  return undefined;
}

function exportedClassNames(fileName: string): Set<string> {
  const code = readFileSync(fileName, "utf8");
  const sourceFile = parseSourceFile(code, fileName);
  const names = new Set<string>();

  for (const statement of sourceFile.program.body) {
    if (statement.type === "ExportDefaultDeclaration" && isClassDeclaration(statement.declaration)) {
      names.add("default");
    } else if (statement.type === "ExportNamedDeclaration" && statement.declaration) {
      if (isClassDeclaration(statement.declaration) && statement.declaration.id)
        names.add(statement.declaration.id.name);
    }
  }

  return names;
}

function importedName(specifier: t.ImportSpecifier | t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier): string {
  if (specifier.type === "ImportDefaultSpecifier") return "default";
  if (specifier.type === "ImportSpecifier") {
    return specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;
  }
  return "*";
}

/**
 * TypeScript allows a class to be imported with `import type`, but constructor
 * injection needs that class' runtime value. Promote local type-only class
 * imports to value imports while leaving interfaces and aliases type-only.
 */
export function transformTypeOnlyClassImports(
  code: string,
  id: string,
  sourceFile: SourceFile = parseSourceFile(code, id),
): string {
  const replacements: Array<{ start: number; end: number; text: string }> = [];

  for (const statement of sourceFile.program.body) {
    if (!isImportDeclaration(statement)) continue;
    if (
      statement.importKind !== "type" &&
      !statement.specifiers.some((item) => item.type === "ImportSpecifier" && item.importKind === "type")
    )
      continue;

    const moduleFile = resolveLocalModule(id, statement.source.value);
    if (!moduleFile) continue;
    const classes = exportedClassNames(moduleFile);
    const promoted = statement.specifiers.filter((item) => classes.has(importedName(item)));
    if (promoted.length === 0) continue;

    const remaining = statement.specifiers.filter((item) => !promoted.includes(item));
    const render = (items: typeof statement.specifiers, typeOnly: boolean): string => {
      const defaults = items.filter((item) => item.type === "ImportDefaultSpecifier").map((item) => item.local.name);
      const named = items
        .filter((item): item is t.ImportSpecifier => item.type === "ImportSpecifier")
        .map((item) => {
          const imported =
            item.imported.type === "Identifier" ? item.imported.name : JSON.stringify(item.imported.value);
          return imported === item.local.name ? imported : `${imported} as ${item.local.name}`;
        });
      const bindings = [...defaults, ...(named.length ? [`{ ${named.join(", ")} }`] : [])].join(", ");
      return `import${typeOnly ? " type" : ""} ${bindings} from ${JSON.stringify(statement.source.value)};`;
    };

    const imports = [render(promoted, false)];
    if (remaining.length > 0) imports.push(render(remaining, true));
    replacements.push({ start: nodeStart(statement), end: nodeEnd(statement), text: imports.join("\n") });
  }

  let result = code;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end);
  }
  return result;
}
