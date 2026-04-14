import type { DucktionDependencies, SingletonMode } from "../types";
import type { LogLevel } from "./DucktionLogger";

import { SCALAR_TOKEN } from "../plugin/transformConstructorDependencies";
import DucktionLogger, { DUCKTION_LOGGER_TOKEN, LogLevelEnum } from "./DucktionLogger";
import ServiceDefinition from "./ServiceDefinition";

/**
 * This is the core component of this whole package. It holds a list of all registered services
 * and their concrete implementations. It also stores all resolved instances as singletons.
 *
 * If you want to start quickly call the `DiContainer.singleton` from anywhere in your code, given
 * it's imported.
 */
class DiContainer {
  /**
   * An internal private reference to the current container.
   */
  private static _singleton: DiContainer;

  /**
   * The current container instance. If there is no container instance, it will
   * create one with good defaults.
   *
   * Using: DiContainer.singleton.register...
   */
  static get singleton(): DiContainer {
    DiContainer._singleton ??= new DiContainer();
    DiContainer._singleton.reinitialize();

    return DiContainer._singleton;
  }

  /**
   * This variable contains all registered service references. The key is the combined ID and the interface
   * with the value being the service definition. The service definition holds the real type, - in a
   * lot of cases both key and value can be the same type. It also contains the singleton instances
   * and other relevant data to resolve the service.
   *
   * Key format: package#TypeName#id
   * If ID is null, it will be printed as an empty string
   *
   * By default we register our own logger, so that we can log all events happening.
   */
  private services: Map<string, ServiceDefinition> = new Map([
    [DUCKTION_LOGGER_TOKEN, new ServiceDefinition(DucktionLogger)],
  ]);

  /**
   * This is the log level for the container itself. It will be used to log all registered services
   * and any other actions the container does.
   *
   * In production you should set this to `error` to only log errors. In development you can set it
   * to `info` or `debug` to get more detailed information.
   */
  private logLevel: LogLevel = LogLevelEnum.error;

  /**
   * If set, Ducktion will try to automatically resolve any given type. This means you don't need
   * to register any services manually. Manually registered services however will always take
   * precedence over automatically resolved ones.
   */
  private enableAutoResolve: boolean = true;

  /**
   * Specify the singleton mode for automatically resolved services. This will only be used if
   * enableAutoResolve is set to true.
   */
  private autoResolveSingletonMode: SingletonMode = "singleton";

  /**
   * A reference to the logger instance. This is used to log all events happening in the container.
   * This variable is resolved within the `reinitialize` method and comes directly from the container.
   *
   * #EatYourOwnDogFood
   */
  private logger?: DucktionLogger;

  /**
   * Reinitialize the container. This will create a new logger instance with the configured log level.
   */
  public reinitialize(): void {
    this.logger = this.__resolveByToken(DUCKTION_LOGGER_TOKEN);
    this.logger?.configure(this.logLevel);

    this.logger?.log(LogLevelEnum.info, "Reinitialized container");
  }

  /**
   * This method can be used to configure the container code-wise. It will reinitialize the container
   *
   * @param newLevel The log level
   * @param newEnableAutoResolve Should auto resolve be enabled
   */
  public configure(
    newLevel: LogLevel = LogLevelEnum.error,
    newEnableAutoResolve: boolean = true,
    newAutoResolveSingletonMode: SingletonMode = "singleton",
  ): void {
    this.logLevel = newLevel;
    this.enableAutoResolve = newEnableAutoResolve;
    this.autoResolveSingletonMode = newAutoResolveSingletonMode;
    this.reinitialize();
  }

  /**
   * Register a new service. The service type is used as both the token and the concrete implementation.
   * The service must not be abstract, an interface or an enum.
   *
   * Note: This method does nothing at runtime, but during build it will be replaced with the
   * `__registerAs()` method, so that it will keep working even when typescript
   * types are stripped from the production build.
   */
  public register<T>(_callback?: () => T): ServiceDefinition {
    throw new Error(
      "register<T> method should have been replaced at build time but was not. Is the vite/rollup plugin running?",
    );
  }

  /**
   * Register a concrete implementation against an interface or abstract type token.
   * Use this when the key type differs from the implementation type:
   *   container.registerAs<ILogger, DebugLogger>()
   *
   * Note: This method does nothing at runtime, but during build it will be replaced with the
   * `__registerAs()` method, so that it will keep working even when typescript
   * types are stripped from the production build.
   */
  public registerAs<_Token, Impl extends _Token>(_callback?: () => Impl): ServiceDefinition {
    throw new Error(
      "registerAs<Token, Impl> method should have been replaced at build time but was not. Is the vite/rollup plugin running?",
    );
  }

  /**
   * Register a concrete implementation against an interface or abstract type token.
   * Use this when the key type differs from the implementation type:
   *   container.registerAs<ILogger, DebugLogger>()
   *
   * Note: It is recommended to use the `registerAs<Token, Impl>` method instead of calling this one directly.
   */
  public __registerAs(token: string, implementation: any, callback?: () => any): ServiceDefinition {
    if (this.services.has(token)) {
      this.logger?.log(LogLevelEnum.error, `Service '${token}' is already registered`);
      throw new Error("Service is already registered. Use `override` to override the service");
    }

    // If the `implementation` is abstract, throw an error.
    // The `__ducktionAbstract` marker will be set by our Vite/Rollup plugin
    if (Object.hasOwn(implementation, "__ducktionAbstract")) {
      this.logger?.log(LogLevelEnum.error, `Service '${implementation.name}' is abstract`);
      throw new Error("Service is abstract");
    }

    // Verify that `implementation` can actually be instantiated.
    if (typeof implementation !== "function" || !implementation.prototype) {
      throw new Error("Service is not instantiable");
    }

    const definition = new ServiceDefinition(implementation);
    this.services.set(token, definition);

    this.logger?.log(LogLevelEnum.debug, `Registered service: ${token} => ${implementation.name}`);

    return definition;
  }

  /**
   * Resolve a given service from the container. It will instantiate the concrete implementation
   * and return it.
   *
   * By default all returned services are stored as singleton. So if you request the same service
   * twice, you will get the same instance.
   *
   * Note: This method does nothing at runtime, but during build it will be replaced with the
   * `__resolveByToken` method, so that it will keep working even when typescript
   * types are stripped from the production build.
   */
  public resolve<_T>(): _T {
    throw new Error(
      "resolve<T> method should have been replaced at build time but was not. Is the vite/rollup plugin running?",
    );
  }

  /**
   * Resolve a given service from the container. It will instantiate the concrete implementation
   * and return it.
   *
   * By default all returned services are stored as singleton. So if you request the same service
   * twice, you will get the same instance.
   *
   * Note: It is recommended to use the `resolve<T>` method instead of calling this one directly.
   */
  public __resolveByToken(token: string): any {
    return this.innerResolve(token, [], undefined);
  }

  /**
   * Resolve a service by token, with the concrete class type available for auto-resolution
   * when the service is not yet registered.
   *
   * This method is called by the plugin-transformed `resolve<T>()` whenever T is a concrete
   * class (not an interface or enum), passing T itself as the second argument so the container
   * can instantiate it automatically without a prior `register<T>()` call.
   *
   * Note: It is recommended to use the `resolve<T>` method instead of calling this one directly.
   */
  public __resolveWithType(token: string, concreteType: any): any {
    return this.innerResolve(token, [], concreteType);
  }

  private innerResolve(token: string, dependencyChain: string[], concreteType: any): any {
    // If we try to resolve scalar values (number, string, etc.) we just fail instantly
    if (token === SCALAR_TOKEN) {
      this.logger?.log(LogLevelEnum.error, "Service cant resolve parameter, because it is a scalar value");
      throw new Error(`Parameter is a scalar value and cannot be resolved`);
    }

    // If there is no service registered for the given token
    // AND auto resolve isn't enabled, we will throw an exception and cancel right away
    if (!this.services.has(token) && !this.enableAutoResolve) {
      this.logger?.log(LogLevelEnum.error, `Service '${token}' is not registered`);
      throw new Error(`Service is not registered`);
    }

    // Next we check if there is already a registered singleton instance for the given type.
    // If so, we will just return it
    let definition = this.services.get(token);
    if (definition && definition.instance !== null) {
      return definition.instance;
    }

    // Here we check the actual type we need to resolve.
    // If the service isn't registered we just take the original type given. Otherwise we take the
    // registered type.
    const serviceType = definition?.serviceType ?? concreteType ?? undefined;
    if (!serviceType) {
      this.logger?.log(LogLevelEnum.error, `Service '${token}' is not registered`);
      throw new Error(`Service is not registered`);
    }

    // Add the current token to the dependency chain
    dependencyChain.push(token);

    // Resolve all dependencies recursively of the constructor
    const instance = new serviceType(
      ...this.resolveParameters(serviceType.__ducktionDependencies ?? [], dependencyChain),
    );

    let isAutoResolved = false;
    if (!definition) {
      definition = new ServiceDefinition(serviceType);
      this.services.set(token, definition);
      isAutoResolved = true;
    }

    // Set the newly created instance as the singleton instance
    if (!isAutoResolved || this.autoResolveSingletonMode === "singleton") {
      definition.setInstance(instance);
    }

    this.logger?.log(LogLevelEnum.debug, `Resolved service: ${token} => ${definition.serviceType.name}`);

    return instance;
  }

  /**
   * This method takes a ducktion dependencies array and resolves all required parameters. It handles circular dependency
   * checks aswell.
   */
  private resolveParameters(dependencies: DucktionDependencies, dependencyChain: string[]): any {
    return dependencies.map((dep: DucktionDependencies[0]): any => {
      // If the token is already in the dependencyChain, we have a circular dependency
      if (dependencyChain.includes(dep.token)) {
        this.logger?.log(LogLevelEnum.error, `Circular dependency detected for parameter: ${dep.name}`);
        throw new Error(`Circular dependency detected for parameter '${dep.name}'`);
      }

      // Add the token to the dependency chain
      dependencyChain.push(dep.token);

      // Resolve the parameter. If any error occurs, we wrap it in another error and bubble it up
      try {
        return this.innerResolve(dep.token, dependencyChain, dep.concrete);
      } catch (error) {
        throw new Error(`Parameter '${dep.name}' could not be resolved`, { cause: error });
      }
    });
  }

  /**
   * Override any registered service with another implementation. Any singleton instance for this type
   * will be cleared as well.
   *
   * The service itself must not be abstract or an enum.
   *
   * Note: This method does nothing at runtime, but during build it will be replaced with the
   * `__override` method, so that it will keep working even when typescript
   * types are stripped from the production build.
   */
  public override<_Token, _Impl extends _Token>(): void {
    throw new Error(
      "override<Token, Impl> method should have been replaced at build time but was not. Is the vite/rollup plugin running?",
    );
  }

  /**
   * Override any registered service with another implementation. Any singleton instance for this type
   * will be cleared as well.
   *
   * The service itself must not be abstract or an enum.
   *
   * Note: It is recommended to use the `override<Token, Impl>` method instead of calling this one directly.
   */
  public __override(token: string, implementation: any): void {
    if (!this.services.has(token)) {
      this.logger?.log(LogLevelEnum.error, `Service '${token}' is not registered`);
      throw new Error("Service is not registered. Use `register` to register the service");
    }

    // If the `implementation` is abstract, throw an error.
    // The `__ducktionAbstract` marker will be set by our Vite/Rollup plugin
    if (Object.hasOwn(implementation, "__ducktionAbstract")) {
      throw new Error("Service is abstract");
    }

    // Verify that `implementation` can actually be instantiated.
    if (typeof implementation !== "function" || !implementation.prototype) {
      throw new Error("Service is not instantiable");
    }

    const definition = new ServiceDefinition(implementation);
    this.services.set(token, definition);

    this.logger?.log(LogLevelEnum.debug, `Overridden service: ${token} => ${implementation.name}`);
  }

  /**
   * Remove all registered services and singleton instances, basically resetting the container.
   */
  public clear(): void {
    this.logger?.log(LogLevelEnum.info, "Clearing container");

    this.services.clear();

    this.services.set(DUCKTION_LOGGER_TOKEN, new ServiceDefinition(DucktionLogger));
    this.reinitialize();
  }

  /**
   * Reset every singleton instance. This will not remove the registered services.
   * If you want to reset everything, use `clear` instead.
   */
  public resetSingletons(): void {
    this.logger?.log(LogLevelEnum.info, "Resetting container");

    this.services.forEach((service) => service.setInstance(null));
    this.reinitialize();
  }
}

export default DiContainer;
