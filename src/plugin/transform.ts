import { parseSourceFile, type SourceFile } from "./ast";
import { collectSourceContext, type SourceContext } from "./collectImports";
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
 * The source file is parsed once and import-collection results are computed once
 * and shared across all stages. A re-parse only happens when a stage actually
 * modifies the code (transforms never touch import declarations, so the context
 * stays valid even after a re-parse).
 */
export const transform = (code: string, id: string): string => {
  let current = code;
  let sf: SourceFile = parseSourceFile(current, id);
  const ctx: SourceContext = collectSourceContext(sf);

  function maybeReparse(next: string): void {
    if (next !== current) {
      current = next;
      sf = parseSourceFile(current, id);
    }
  }

  maybeReparse(transformGenericCalls(current, id, sf, ctx));
  maybeReparse(transformAbstractClasses(current, id, sf));
  maybeReparse(transformConstructorDependencies(current, id, sf, ctx));
  maybeReparse(transformDecoratorProperties(current, id, sf, ctx));
  maybeReparse(transformDecoratorMethods(current, id, sf, ctx));

  return current;
};
