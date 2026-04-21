/**
 * This decorator can be used to define services that should be resolved when resolving the main service.
 * It can be used on public fields, private fields, constructor parameters, method parameters and even
 * whole methods.
 */

/** Resolves the dependency by type, using the property's type annotation as the token. */
export function resolve(): (target: any, propertyKey: string) => void;

/** Resolves the dependency by type and id, using the property's type annotation as the token. */
export function resolve(id: string): (target: any, propertyKey: string) => void;

/** Applied as a bare `@resolve` on a method — the plugin injects the method into `__ducktionResolveMethods` so the container calls it with resolved arguments after instantiation. */
export function resolve(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;

export function resolve(tokenOrIdOrTarget?: any, concreteTypeOrKey?: any, idOrDescriptor?: any): any {
  if (typeof tokenOrIdOrTarget === "string") {
    // Plugin-transformed property decorator: resolve("token", ConcreteType|undefined, "id"?)
    const token = tokenOrIdOrTarget;
    const concreteType = concreteTypeOrKey;
    const id = typeof idOrDescriptor === "string" ? idOrDescriptor : undefined;
    return function (target: any, propertyKey: string) {
      if (!Object.prototype.hasOwnProperty.call(target.constructor, "__ducktionResolveProperties")) {
        target.constructor.__ducktionResolveProperties = [];
      }
      target.constructor.__ducktionResolveProperties.push({ propertyKey, token, concrete: concreteType, id });
    };
  }
  // Method decorator — no-op at runtime; the plugin injects __ducktionResolveMethods
}
