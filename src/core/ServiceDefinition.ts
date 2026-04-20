import type { Instantiable, LazyMode } from "../types";

/**
 * This class hold all the information needed to resolve a service.
 * Most variables can't be set directly by the user, but only by the container.
 */
class ServiceDefinition {
  /**
   * The type of the service. Or to be more precice it has to be an instantiable
   * type, e.g. a class for example.
   */
  public readonly serviceType: Instantiable;

  /**
   * The singleton instance of the service. Can be undefined if the service is not a singleton
   * or if the service has not been resolved yet.
   *
   * Can only be set by the container.
   */
  private _instance: any = undefined;

  /**
   * The given callback to resolve the service. Can be undefined if no callback was given.
   */
  private _callback: (() => any) | undefined = undefined;

  /**
   * Specify if the service should be resolved lazily or not. By default, no lazy mode
   * is specified (undefined), which means that the container will use the default lazy mode.
   */
  private _lazyMode: LazyMode | undefined = undefined;

  public constructor(serviceType: Instantiable) {
    this.serviceType = serviceType;
  }

  /**
   * The singleton instance of the service. Can be undefined if the service is not a singleton
   * or if the service has not been resolved yet.
   *
   * Can only be set by the container.
   */
  public get instance() {
    return this._instance;
  }

  /**
   * Set the instance of this service. This will override the
   * concrete implementation or reset it if undefined is given.
   */
  public setInstance(instance: any): ServiceDefinition {
    this._instance = instance;

    return this;
  }

  /**
   * The given callback to resolve the service. Can be undefined if no callback was given.
   */
  public get callback() {
    return this._callback;
  }

  /**
   * Set the callback which will be executed when the service is
   * resolved. This will also reset the instance if it was set.
   */
  public setCallback(callback: (() => any) | undefined): ServiceDefinition {
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
}

export default ServiceDefinition;
