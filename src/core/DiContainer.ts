import type {
  ContainerOptions,
  DiConfigurator,
  DucktionDependencies,
  DucktionResolveMethods,
  DucktionResolveParameters,
  DucktionResolveTagsParameters,
  Implementation,
  LazyMode,
  SingletonMode,
} from "../types";

import { SCALAR_TOKEN } from "../plugin/transformConstructorDependencies";
import DucktionLogger, { DUCKTION_LOGGER_TOKEN, LogLevel } from "./DucktionLogger";
import ServiceDefinition from "./ServiceDefinition";
import { getStatic } from "./utils";

const EMPTY_PARAMETERS: Map<string, unknown> = new Map();

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

    return DiContainer._singleton;
  }

  /**
   * This variable contains all registered service references. The key is the combined ID and the interface
   * with the value being the service definition. The service definition holds the real type, - in a
   * lot of cases both key and value can be the same type. It also contains the singleton instances
   * and other relevant data to resolve the service.
   *
   * Key format: package#TypeName___id
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
  private logLevel: LogLevel = LogLevel.error;

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
   * Specify the default lazy mode any service should be registered with. This will only be used
   * if no other lazy mode is specified during registration.
   */
  private defaultLazyMode: LazyMode = "lazy";

  /**
   * Specify the default singleton mode any service should be registered with. This will only
   * be used if no other singleton mode is specified during registration.
   *
   * Auto resolved services will always use the `autoResolveSingletonMode` variable.
   */
  private defaultSingletonMode: SingletonMode = "singleton";

  /**
   * A reference to the logger instance. This is used to log all events happening in the container.
   * This variable is resolved within the `reinitialize` method and comes directly from the container.
   *
   * #EatYourOwnDogFood
   */
  private logger?: DucktionLogger;

  /**
   * This is a list of all registered configurators. This list is used in the `reinitialize` method
   * and all configurators are called to register their services.
   */
  private configurators: DiConfigurator[] = [];

  /**
   * Initialize the container. This will create a new logger instance with the configured log level.
   * This is an alias for `reinitialize`
   */
  public initialize(): DiContainer {
    return this.reinitialize();
  }

  /**
   * Reinitialize the container. This will create a new logger instance with the configured log level.
   */
  public reinitialize(): DiContainer {
    this.logger = this.__resolveByToken(DUCKTION_LOGGER_TOKEN) as DucktionLogger;
    this.logger?.configure(this.logLevel);

    this.configurators.forEach((c) => {
      c.register(this);

      this.logger?.log(LogLevel.info, `Using configurator: ${c.name()}`);
    });

    this.initializeNonLazyServices();

    this.logger?.log(LogLevel.info, "Reinitialized container");

    return this;
  }

  /**
   * This will initialize all non-lazy services. If a service has no lazy mode specified, it will
   * default to the `defaultLazyMode` variable.
   */
  private initializeNonLazyServices(): void {
    this.services.forEach((definition, key) => {
      if (
        definition.lazyMode === "non-lazy" ||
        (definition.lazyMode === undefined && this.defaultLazyMode === "non-lazy")
      ) {
        this.__resolveByToken(key);
      }
    });
  }

  /**
   * This method can be used to configure the container code-wise. It will reinitialize the container
   *
   * @param newLevel The log level
   * @param newEnableAutoResolve Should auto resolve be enabled
   */
  public configure(options: Partial<ContainerOptions>): DiContainer {
    const {
      newLevel = LogLevel.error,
      newEnableAutoResolve = true,
      newAutoResolveSingletonMode = "singleton",
      newDefaultLazyMode = "lazy",
      newDefaultSingletonMode = "singleton",
    } = options;

    this.logLevel = newLevel;
    this.enableAutoResolve = newEnableAutoResolve;
    this.autoResolveSingletonMode = newAutoResolveSingletonMode;
    this.defaultLazyMode = newDefaultLazyMode;
    this.defaultSingletonMode = newDefaultSingletonMode;

    return this.reinitialize();
  }

  /**
   * Add a new configurator to the container. This will not execute the configurator, if
   * the container is already initialized. If you want to reinitialize the container, use
   * the `reinitialize` method.
   */
  public addConfigurator(configurator: DiConfigurator): DiContainer {
    this.configurators.push(configurator);

    return this;
  }

  /**
   * Register a new service. The service type is used as both the token and the concrete implementation.
   * The service must not be abstract, an interface or an enum.
   *
   * Note: This method does nothing at runtime, but during build it will be replaced with the
   * `__registerAs()` method, so that it will keep working even when typescript
   * types are stripped from the production build.
   */
  public register<_T>(_id?: string): ServiceDefinition {
    throw new Error(
      "register<T> method should have been replaced at build time but was not. Is the bundler plugin running?",
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
  public registerAs<_Token, _Impl extends _Token>(_id?: string): ServiceDefinition {
    throw new Error(
      "registerAs<Token, Impl> method should have been replaced at build time but was not. Is the bundler plugin running?",
    );
  }

  /**
   * Register a concrete implementation against an interface or abstract type token.
   * Use this when the key type differs from the implementation type:
   *   container.registerAs<ILogger, DebugLogger>()
   *
   * Note: It is recommended to use the `registerAs<Token, Impl>` method instead of calling this one directly.
   */
  public __registerAs(token: string, implementation: Implementation, id?: string): ServiceDefinition {
    if (id) token += `___${id}`;

    if (this.services.has(token)) {
      this.logger?.log(LogLevel.error, `Service '${token}' is already registered`);
      throw new Error("Service is already registered. Use `override` to override the service");
    }

    // If the `implementation` is abstract, throw an error.
    // The `__ducktionAbstract` marker will be set by our bundler plugin
    if (Object.hasOwn(implementation, "__ducktionAbstract")) {
      this.logger?.log(LogLevel.error, `Service '${implementation.name}' is abstract`);
      throw new Error("Service is abstract");
    }

    // Verify that `implementation` can actually be instantiated.
    if (typeof implementation !== "function" || !implementation.prototype) {
      throw new Error("Service is not instantiable");
    }

    const definition = new ServiceDefinition(implementation);

    this.services.set(token, definition);

    this.logger?.log(LogLevel.debug, `Registered service: ${token} => ${implementation.name}`);

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
  public resolve<_T>(_id?: string): _T {
    throw new Error(
      "resolve<T> method should have been replaced at build time but was not. Is the bundler plugin running?",
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
  public __resolveByToken(token: string, id?: string): object {
    if (id) token += `___${id}`;

    return this.innerResolve(token, new Set());
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
  public __resolveWithType(token: string, concreteType: Implementation | undefined, id?: string): object {
    if (id) token += `___${id}`;

    return this.innerResolve(token, new Set(), concreteType);
  }

  /**
   * Inner logic to resolve a component. This method handles the recursive resolving of all
   * parameters of the constructor. Also it checks for circular dependencies.
   */
  private innerResolve(token: string, dependencyChain: Set<string>, concreteType?: Implementation): object {
    // If we try to resolve scalar values (number, string, etc.) we just fail instantly
    if (token === SCALAR_TOKEN) {
      this.logger?.log(LogLevel.error, "Service cant resolve parameter, because it is a scalar value");
      throw new Error(`Parameter is a scalar value and cannot be resolved`);
    }

    // If there is no service registered for the given token
    // AND auto resolve isn't enabled, we will throw an exception and cancel right away
    if (!this.services.has(token) && !this.enableAutoResolve) {
      this.logger?.log(LogLevel.error, `Service '${token}' is not registered`);
      throw new Error(`Service is not registered`);
    }

    // Next we check if there is already a registered singleton instance for the given type.
    // If so, we will just return it
    let definition = this.services.get(token);
    if (definition && definition.instance !== undefined) {
      return definition.instance;
    }

    // Next we check if there is a callback which should be executed
    if (definition && definition.callback) {
      // If so, we will execute the callback
      const instance = definition.callback();

      // If the service is in singleton mode, we will store the instance
      // If no singleton mode is specified, we will use the default singleton mode
      if ((definition.singletonMode ?? this.defaultSingletonMode) === "singleton") {
        this.storeAsSingleton(token, instance, definition.serviceType, definition);
      }

      // Anyway, return the resolved instance
      return instance;
    }

    // If the service is not registered and auto resolved is enabled, check if the service
    // is allowed to be auto resolved.
    if (!definition && concreteType?.prototype.__ducktionPreventAutoResolve === true) {
      this.logger?.log(
        LogLevel.error,
        "Service is restricted from being auto resolved. Explicitly register it instead.",
      );

      throw new Error("Service is restricted from being auto resolved. Explicitly register it instead.");
    }

    // Here we check the actual type we need to resolve.
    // If the service isn't registered we just take the original type given. Otherwise we take the
    // registered type.
    const serviceType = definition?.serviceType ?? concreteType ?? undefined;
    if (!serviceType) {
      this.logger?.log(LogLevel.error, `Service '${token}' is not registered`);
      throw new Error(`Service is not registered`);
    }

    // Add the current token to the dependency chain; remove it in finally so that
    // after this frame completes, sibling services are not blocked by it.
    dependencyChain.add(token);
    try {
      // Resolve all dependencies recursively of the constructor
      const instance = new serviceType(
        ...this.resolveParameters(
          serviceType.__ducktionDependencies ?? [],
          dependencyChain,
          definition?.parameters ?? new Map(),
        ),
      );

      // And resolve all dependencies that occur because of the Resolve decorator
      this.resolveDependencies(instance, dependencyChain);

      const isAutoResolved = definition === undefined;

      // This is a complex check to determine if the resolved service should be stored as a singleton
      // Basically it will be stored if:
      // (a) auto resolve is enabled and the auto resolve singleton mode is set to singleton
      // or (b) auto resolve is disabled and the service singleton mode is set to singleton
      // If in case (b) the service singleton mode is not set, we will use the default singleton mode
      const storeSingleton =
        (isAutoResolved && this.autoResolveSingletonMode === "singleton") ||
        (!isAutoResolved && (definition?.singletonMode ?? "singleton") === this.defaultSingletonMode);

      if (storeSingleton) {
        this.storeAsSingleton(token, instance, serviceType, definition);
      }

      this.logger?.log(LogLevel.debug, `Resolved service: ${token} => ${serviceType.name}`);

      return instance;
    } finally {
      dependencyChain.delete(token);
    }
  }

  /**
   * Register a given instance as a singleton for the given type.
   * If the type is already registered, it will override the instance.
   * Otherwise it will create a new service definition.
   */
  private storeAsSingleton(
    token: string,
    instance: object,
    concreteType: Implementation,
    definition: ServiceDefinition | undefined,
  ): void {
    if (definition) {
      definition.setInstance(instance);

      return;
    }

    this.services.set(token, new ServiceDefinition(concreteType).setInstance(instance));
  }

  /**
   * Resolve any `@resolve` and `@resolveTags` decorator usages in the given instance.
   * This will resolve all properties which have the @resolve decorator, all methods
   * which contain the @resolve decorator and all properties that have the
   * `@resolveTags` decorator.
   */
  public resolveDependencies(instance: object, dependencyChain?: Set<string>) {
    dependencyChain ??= new Set();

    const resolveProperties = getStatic<DucktionResolveParameters>(instance, "__ducktionResolveProperties");
    const resolveMethods = getStatic<DucktionResolveMethods>(instance, "__ducktionResolveMethods");
    const resolveTagProperties = getStatic<DucktionResolveTagsParameters>(instance, "__ducktionResolveTagProperties");

    const obj = instance as unknown as Record<string, any>;

    for (const prop of resolveProperties ?? []) {
      const token = prop.id ? `${prop.token}___${prop.id}` : prop.token;
      obj[prop.propertyKey] = this.innerResolve(token, dependencyChain, prop.concrete);
    }

    for (const prop of resolveTagProperties ?? []) {
      obj[prop.propertyKey] = [...this.getTagged(prop.tag)];
    }

    // Call @resolve-decorated methods with their resolved dependencies
    for (const method of resolveMethods ?? []) {
      obj[method.methodKey](...this.resolveParameters(method.dependencies, dependencyChain, EMPTY_PARAMETERS));
    }
  }

  /**
   * This method takes a ducktion dependencies array and resolves all required parameters. It handles circular dependency
   * checks aswell.
   */
  private resolveParameters(
    dependencies: DucktionDependencies,
    dependencyChain: Set<string>,
    parameters: Map<string, unknown>,
  ): unknown[] {
    return dependencies.map((dep): any => {
      // If parameters were set specifically, apply them here and don't use the
      // service container.
      if (parameters.has(dep.name)) {
        return parameters.get(dep.name);
      }

      // Tag-based dependency: resolve all services with the given tag as an array
      if (dep.tag) {
        return [...this.getTagged(dep.tag)];
      }

      const token = dep.id ? `${dep.token}___${dep.id}` : dep.token;

      // If the token is already in the dependencyChain, we have a circular dependency
      if (dependencyChain.has(token)) {
        this.logger?.log(LogLevel.error, `Circular dependency detected for parameter: ${dep.name}`);
        throw new Error(`Circular dependency detected for parameter '${dep.name}'`);
      }

      // Resolve the parameter. If any error occurs, we wrap it in another error and bubble it up
      // innerResolve owns adding/removing the token from the chain.
      try {
        return this.innerResolve(token, dependencyChain, dep.concrete);
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
  public override<_Token, _Impl extends _Token = _Token>(_id?: string): ServiceDefinition {
    throw new Error(
      "override<Token, Impl> method should have been replaced at build time but was not. Is the bundler plugin running?",
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
  public __override(token: string, implementation?: Implementation, id?: string): ServiceDefinition {
    if (id) token += `___${id}`;

    if (!this.services.has(token)) {
      this.logger?.log(LogLevel.error, `Service '${token}' is not registered`);
      throw new Error("Service is not registered. Use `register` to register the service");
    }

    // If no implementation given, return the existing definition as-is so the caller
    // can configure it (e.g. set a custom instance) without changing the serviceType.
    if (implementation === undefined) {
      this.logger?.log(LogLevel.debug, `Overridden service (metadata only): ${token}`);

      return this.services.get(token)!;
    }

    // If the `implementation` is abstract, throw an error.
    // The `__ducktionAbstract` marker will be set by our bundler plugin
    if (Object.hasOwn(implementation, "__ducktionAbstract")) {
      throw new Error("Service is abstract");
    }

    // Verify that `implementation` can actually be instantiated.
    if (typeof implementation !== "function" || !implementation.prototype) {
      throw new Error("Service is not instantiable");
    }

    const definition = new ServiceDefinition(implementation);
    this.services.set(token, definition);

    this.logger?.log(LogLevel.debug, `Overridden service: ${token} => ${implementation.name}`);

    return definition;
  }

  /**
   * Remove all registered services and singleton instances, basically resetting the container.
   */
  public clear(): DiContainer {
    this.logger?.log(LogLevel.info, "Clearing container");

    this.services.clear();

    this.services.set(DUCKTION_LOGGER_TOKEN, new ServiceDefinition(DucktionLogger));

    return this.reinitialize();
  }

  /**
   * Reset every singleton instance. This will not remove the registered services.
   * If you want to reset everything, use `clear` instead.
   */
  public resetSingletons(): DiContainer {
    this.logger?.log(LogLevel.info, "Resetting container");

    this.services.forEach((service) => service.setInstance(undefined));

    return this.reinitialize();
  }

  /**
   * Return all resolved services based on the services that currently
   * have the given tag. It uses a generator and only resolves the services
   * when accessing them.
   */
  public *getTagged<T>(tag: string): Generator<T, void, unknown> {
    for (let [token, definition] of this.services) {
      if (definition.tags.has(tag)) {
        yield this.innerResolve(token, new Set()) as T;
      }
    }
  }
}

export default DiContainer;
