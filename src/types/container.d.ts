import type DiContainer from "../core/DiContainer";
import type { LogLevel } from "../core/DucktionLogger";
import type { SingletonMode, LazyMode } from "./services";

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

  /**
   * New default singleton mode. Can be overriden by any service. Default: `singleton`
   */
  newDefaultSingletonMode: SingletonMode;
};

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
