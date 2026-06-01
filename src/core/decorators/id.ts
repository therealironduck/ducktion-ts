/**
 * This decorator can be used on constructor parameters (and method parameters)
 * to specify which registered id to resolve for that dependency.
 *
 * Example:
 *   public constructor(@id("primary") logger: ILogger) {}
 *
 * This is a no-op at runtime. The bundler plugin reads the decorator from
 * the AST and injects the id into the `__ducktionDependencies` / `__ducktionResolveMethods`
 * static arrays, which the container then uses at resolve time.
 */
export function id(
  _id: string,
): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void {
  return function () {
    // no-op — the plugin injects the id into __ducktionDependencies
  };
}
