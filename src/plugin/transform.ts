import ts from "typescript";

import { transformAbstractClasses } from "./transformAbstractClasses";
import { transformConstructorDependencies } from "./transformConstructorDependencies";
import { transformDecoratorMethods } from "./transformDecoratorMethods";
import { transformDecoratorProperties } from "./transformDecoratorProperties";
import { transformGenericCalls } from "./transformGenericCalls";

/**
 * Applies all plugin transforms to a TypeScript source file:
 *  1. Rewrites generic DI calls (`register<T>`, `resolve<T>`, `registerAs<T, T2>`)
 *     to their runtime equivalents before type erasure.
 *  2. Injects `static __ducktionAbstract = true;` into abstract class declarations so
 *     the abstract marker survives compilation.
 *  3. Injects `static __ducktionDependencies = [...]` into non-abstract classes so
 *     constructor parameter types survive compilation as token strings.
 *  4. Rewrites `@resolve()` decorator calls on class properties so the declared
 *     type token and concrete constructor survive type erasure.
 *  5. Injects `static __ducktionResolveMethods = [...]` for methods decorated
 *     with bare `@resolve` so parameter types survive type erasure.
 *
 * The source file is parsed once and the AST is reused across stages. A re-parse
 * only happens when a stage actually modifies the code, keeping the AST in sync
 * for the next stage without redundant work.
 */
export const transform = (code: string, id: string): string => {
  let current = code;
  let sourceFile = ts.createSourceFile(id, current, ts.ScriptTarget.Latest, true);

  const apply = (fn: (code: string, id: string, sf: ts.SourceFile) => string): void => {
    const next = fn(current, id, sourceFile);
    if (next !== current) {
      current = next;
      sourceFile = ts.createSourceFile(id, current, ts.ScriptTarget.Latest, true);
    }
  };

  apply(transformGenericCalls);
  apply(transformAbstractClasses);
  apply(transformConstructorDependencies);
  apply(transformDecoratorProperties);
  apply(transformDecoratorMethods);

  return current;
};
