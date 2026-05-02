/**
 * This decorator can be used to defines which tag should be used to resolve given parameter array. It can be used on
 * public fields, private fields, constructor parameters and method parameters.
 */
export function resolveTags(
  tag: string,
): (target: any, propertyKey: string | symbol | undefined, parameterIndex?: number) => void {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex?: number) {
    // Parameter decorator (constructor or method) — no-op at runtime.
    // The build plugin injects the tag into __ducktionDependencies / __ducktionResolveMethods.
    if (parameterIndex !== undefined) return;

    if (!Object.prototype.hasOwnProperty.call(target.constructor, "__ducktionResolveTagProperties")) {
      target.constructor.__ducktionResolveTagProperties = [];
    }
    target.constructor.__ducktionResolveTagProperties.push({ propertyKey, tag });
  };
}
