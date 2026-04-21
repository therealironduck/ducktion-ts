/**
 * This decorator can be used to define services that should be resolved when resolving the main service.
 * It can be used on public fields, private fields, constructor parameters, method parameters and even
 * whole methods.
 */
export function resolve(token: string, concreteType?: any) {
  return function (target: any, propertyKey: string) {
    if (!Object.prototype.hasOwnProperty.call(target.constructor, "__ducktionResolveProperties")) {
      target.constructor.__ducktionResolveProperties = [];
    }
    target.constructor.__ducktionResolveProperties.push({ propertyKey, token, concrete: concreteType });
  };
}
