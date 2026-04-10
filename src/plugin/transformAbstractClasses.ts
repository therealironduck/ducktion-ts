/**
 * Injects `static __ducktionAbstract = true;` as the first member of every
 * abstract class declaration. This preserves the abstract-ness marker at
 * runtime after TypeScript erases the `abstract` keyword during compilation.
 * The ducktion-prefixed name avoids collisions with other libraries.
 *
 * Examples:
 *   abstract class BaseService {}
 *   → abstract class BaseService { static __ducktionAbstract = true; }
 *
 *   abstract class BaseService { abstract greet(): string; }
 *   → abstract class BaseService { static __ducktionAbstract = true; abstract greet(): string; }
 *
 * Non-abstract classes and classes that already carry `__ducktionAbstract` are left
 * untouched. Nested abstract classes are handled correctly.
 */

import ts from "typescript";

export const transformAbstractClasses = (code: string, id: string): string => {
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true);

  const insertions: Array<{ pos: number; text: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)) {
      const alreadyInjected = node.members.some(
        (m) => ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name) && m.name.text === "__ducktionAbstract",
      );

      if (!alreadyInjected) {
        insertions.push({ pos: node.members.pos, text: " static __ducktionAbstract = true;" });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (insertions.length === 0) {
    return code;
  }

  // Apply in reverse order so earlier positions stay valid.
  insertions.sort((a, b) => b.pos - a.pos);

  let result = code;
  for (const { pos, text } of insertions) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }

  return result;
};
