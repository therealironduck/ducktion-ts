/**
 * This decorator can be used to defines which tag should be used to resolve given parameter array. It can be used on
 * public fields, private fields, constructor parameters and method parameters.
 */
export function resolveTags(tag: string): (target: any, propertyKey: string) => void {
  return function (target: any, propertyKey: string) {
    if (!Object.prototype.hasOwnProperty.call(target.constructor, "__ducktionResolveTagProperties")) {
      target.constructor.__ducktionResolveTagProperties = [];
    }
    target.constructor.__ducktionResolveTagProperties.push({ propertyKey, tag });
  };
}
