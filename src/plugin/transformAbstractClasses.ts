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

import {
  isClassDeclaration,
  isClassProperty,
  isIdentifier,
  nodeStart,
  parseSourceFile,
  type SourceFile,
  visit,
} from "./ast";

export const transformAbstractClasses = (
  code: string,
  id: string,
  sourceFile: SourceFile = parseSourceFile(code, id),
): string => {
  const insertions: Array<{ pos: number; text: string }> = [];

  visit(sourceFile, (node) => {
    if (isClassDeclaration(node) && node.abstract) {
      const alreadyInjected = node.body.body.some(
        (member) => isClassProperty(member) && isIdentifier(member.key) && member.key.name === "__ducktionAbstract",
      );

      if (!alreadyInjected) {
        insertions.push({ pos: nodeStart(node.body) + 1, text: " static __ducktionAbstract = true;" });
      }
    }
  });

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
