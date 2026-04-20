import type DiContainer from "./core/DiContainer";
import type { LogLevel } from "./core/DucktionLogger";

export interface Options {
  // define your plugin options here
}

/**
 * This type is used for internal resolving. The vite/rollup plugin writes
 * a static array with all dependencies to each class which follows this
 * type.
 */
export type DucktionDependencies = Array<{
  name: string;
  token: string;
  concrete: DucktionDependencies[0] | undefined;
}>;

/**
 * A small helper type which defines instantiable objects for Ducktion.
 * It contains the `new` operator aswell as the ducktion dependencies which
 * get auto added by the vite/rolldown plugin.
 */
export type Instantiable = {
  new (...args: any[]): any;
  __ducktionDependencies?: DucktionDependencies;
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
 * You should implement this type to register your dependencies.
 */
export type DiConfigurator = {
  /**
   * In this method you may use the container to register your dependencies.
   * Please note that you should not use the container to resolve dependencies at
   * this stage, as it may not be fully configured yet.
   */
  register(container: DiContainer): void;

  /**
   * This method should return a readable name for debugging and logging.
   */
  name(): string;
};

/**
 * All options to configure the DI container.
 */
export type ContainerOptions = {
  /**
   * The new log level to be used. Default: `error`
   */
  newLevel: LogLevel;

  /**
   * Should auto-resolve be enabled. Default: `true`
   */
  newEnableAutoResolve: boolean;

  /**
   * Singleton mode for auto resolved services. Default: `singleton`
   */
  newAutoResolveSingletonMode: SingletonMode;

  /**
   * New default lazy mode. Can be overriden by any service. Default: `lazy`
   */
  newDefaultLazyMode: LazyMode;
};
