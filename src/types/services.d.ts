/**
 * A small helper type which defines instantiable objects for Ducktion.
 * It contains the `new` operator aswell as the ducktion dependencies which
 * get auto added by the vite/rolldown plugin.
 */
export type Implementation = {
  new (...args: any[]): object;

  __ducktionDependencies?: DucktionDependencies;
  __ducktionAbstract?: boolean;
};

/**
 * This type is used to define if a service is a singleton or not.
 */
export type SingletonMode = "singleton" | "non-singleton";

/**
 * This type is used to define the lazy mode of a service. Lazy means that the service
 * will be instantiated only when it is requested. NonLazy means that the service will
 * be instantiated when the container is initialized.
 */
export type LazyMode = "non-lazy" | "lazy";

/**
 * This type is used for internal resolving. The vite/rollup plugin writes
 * a static array with all dependencies to each class which follows this
 * type.
 */
export type DucktionDependencies = Array<{
  name: string;
  token: string;
  concrete?: Implementation;
  id?: string;
}>;

/**
 * This type defines the parameters that the `@resolve` decorator contains if used
 * for parameters.
 */
export type DucktionResolveParameters = Array<{
  propertyKey: string;
  token: string;
  concrete: Implementation;
  id?: string | undefined;
}>;

/**
 * This type defines the parameters that the `@resolve` decorator contains if used
 * for methods.
 */
export type DucktionResolveMethods = Array<{
  methodKey: string;
  dependencies: DucktionDependencies;
}>;
