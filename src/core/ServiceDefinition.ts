import type { Implementation, LazyMode, SingletonMode } from "../types";

/**
 * This class hold all the information needed to resolve a service.
 * Most variables can't be set directly by the user, but only by the container.
 */
class ServiceDefinition {
  /**
   * The type of the service. Or to be more precice it has to be an instantiable
   * type, e.g. a class for example.
   */
  public readonly serviceType: Implementation;

  /**
   * The singleton instance of the service. Can be undefined if the service is not a singleton
   * or if the service has not been resolved yet.
   *
   * Can only be set by the container.
   */
  private _instance: object | undefined = undefined;

  /**
   * The given callback to resolve the service. Can be undefined if no callback was given.
   */
  private _callback: (() => object) | undefined = undefined;

  /**
   * Specify if the service should be resolved lazily or not. By default, no lazy mode
   * is specified (undefined), which means that the container will use the default lazy mode.
   */
  private _lazyMode: LazyMode | undefined = undefined;

  /**
   * Specify if the service should be stored as a singleton or not. By default, no singleton
   * mode is specified (undefined), which means that the container will use the default singleton mode.
   */
  private _singletonMode: SingletonMode | undefined = undefined;

  /**
   * Specify parameters which will be given to the constructor when service
   * is resolved. Parameters given here will be not resolved through the
   * dependency injection container.
   */
  private _parameters: Map<string, unknown> = new Map();

  public constructor(serviceType: Implementation) {
    this.serviceType = serviceType;
  }

  /**
   * The singleton instance of the service. Can be undefined if the service is not a singleton
   * or if the service has not been resolved yet.
   *
   * Can only be set by the container.
   */
  public get instance(): object | undefined {
    return this._instance;
  }

  /**
   * Set the instance of this service. This will override the
   * concrete implementation or reset it if undefined is given.
   */
  public setInstance(instance: object | undefined): ServiceDefinition {
    this._instance = instance;

    return this;
  }

  /**
   * The given callback to resolve the service. Can be undefined if no callback was given.
   */
  public get callback(): (() => object) | undefined {
    return this._callback;
  }

  /**
   * Set the callback which will be executed when the service is
   * resolved. This will also reset the instance if it was set.
   */
  public setCallback(callback: (() => object) | undefined): ServiceDefinition {
    this._callback = callback;
    this._instance = undefined;

    return this;
  }

  /**
   * Specify if the service should be resolved lazily or not. By default, no lazy mode
   * is specified (undefined), which means that the container will use the default lazy mode.
   */
  public get lazyMode(): LazyMode | undefined {
    return this._lazyMode;
  }

  /**
   * Mark this service as non lazy.
   */
  public nonLazy(): ServiceDefinition {
    this._lazyMode = "non-lazy";

    return this;
  }

  /**
   * Mark this service as lazy.
   */
  public lazy(): ServiceDefinition {
    this._lazyMode = "lazy";

    return this;
  }

  /**
   * Set the lazy mode of this service.
   */
  public setLazyMode(lazyMode: LazyMode | undefined): ServiceDefinition {
    this._lazyMode = lazyMode;

    return this;
  }

  /*
   * Specify if the service should be stored as a singleton or not. By default, no singleton
   * mode is specified (undefined), which means that the container will use the default singleton mode.
   */
  public get singletonMode(): SingletonMode | undefined {
    return this._singletonMode;
  }

  /**
   * Mark this service as non singleton
   */
  public nonSingleton(): ServiceDefinition {
    this._singletonMode = "non-singleton";

    return this;
  }

  /**
   * Mark this service as non singleton. Alias for `nonSingleton`
   */
  public transient(): ServiceDefinition {
    this._singletonMode = "non-singleton";

    return this;
  }

  /**
   * Mark this service as singleton
   */
  public singleton(): ServiceDefinition {
    this._singletonMode = "singleton";

    return this;
  }

  /**
   * Set the singleton mode of this service.
   */
  public setSingletonMode(singletonMode: SingletonMode | undefined): ServiceDefinition {
    this._singletonMode = singletonMode;
    return this;
  }

  /**
   * Specify parameters which will be given to the constructor when service
   * is resolved. Parameters given here will be not resolved through the
   * dependency injection container.
   */
  public get parameters(): Map<string, unknown> {
    return this._parameters;
  }

  /**
   * Set parameters which will be given to the constructor when service
   * is resolved. This will also reset the instance if it was set.
   */
  public setParameter(name: string, value: unknown): ServiceDefinition {
    this._instance = undefined;
    this._parameters.set(name, value);

    return this;
  }

  /**
   * Remove pre-set parameter when service is resolved. This will also reset
   * the instance if it was set.
   */
  public removeParameter(name: string): ServiceDefinition {
    this._parameters.delete(name);

    return this;
  }
}

export default ServiceDefinition;
