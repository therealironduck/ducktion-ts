import { transformAbstractClasses } from "./transformAbstractClasses";
import { transformGenericCalls } from "./transformGenericCalls";

/**
 * Applies all plugin transforms to a TypeScript source file:
 *  1. Rewrites generic DI calls (`register<T>`, `resolve<T>`, `registerAs<T, T2>`)
 *     to their runtime equivalents before type erasure.
 *  2. Injects `static __ducktionAbstract = true;` into abstract class declarations so
 *     the abstract marker survives compilation.
 */
export const transform = (code: string, id: string): string => {
  let result = transformGenericCalls(code, id);
  result = transformAbstractClasses(result, id);
  return result;
};
