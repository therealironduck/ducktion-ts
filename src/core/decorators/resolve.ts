/**
 * This decorator can be used to define services that should be resolved when resolving the main service.
 * It can be used on public fields, private fields, constructor parameters, method parameters and even
 * whole methods.
 */
export function resolve(token: string, concreteType?: any): (target: any, propertyKey: string) => void;
export function resolve(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export function resolve(tokenOrTarget: any, concreteTypeOrKey?: any, _descriptor?: PropertyDescriptor): any {
  if (typeof tokenOrTarget === "string") {
    const token = tokenOrTarget;
    const concreteType = concreteTypeOrKey;
    return function (target: any, propertyKey: string) {
      if (!Object.prototype.hasOwnProperty.call(target.constructor, "__ducktionResolveProperties")) {
        target.constructor.__ducktionResolveProperties = [];
      }
      target.constructor.__ducktionResolveProperties.push({ propertyKey, token, concrete: concreteType });
    };
  }
  // Method decorator — no-op at runtime; the plugin injects __ducktionResolveMethods
}
