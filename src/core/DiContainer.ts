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
  private services: Map<string, ServiceDefinition> = new Map();

  /**
   * Register a new service. The service type is used as both the token and the concrete implementation.
   * The service must not be abstract, an interface or an enum.
   *
   * Note: This method does nothing at runtime, but during build it will be replaced with the
   * `__registerAs()` method, so that it will keep working even when typescript
   * types are stripped from the production build.
   */
  public register<_T>() {
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
  public registerAs<_Token, _Impl>() {
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
  public __registerAs(token: string, implementation: any) {
    // TODO: Implementation instantaible
    this.services.set(token, new ServiceDefinition(implementation));
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
  public __resolveByToken(token: string) {
    const definition = this.services.get(token);
    if (!definition) {
      throw new Error("Service is not registered");
    }

    return new definition.serviceType();
  }
}

export default DiContainer;
