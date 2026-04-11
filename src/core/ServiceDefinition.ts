import type { Instantiable } from "../types";

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
   * The singleton instance of the service. Can be null if the service is not a singleton
   * or if the service has not been resolved yet.
   *
   * Can only be set by the container.
   */
  private _instance: any = null;

  public constructor(serviceType: Instantiable) {
    this.serviceType = serviceType;
  }

  /**
   * The singleton instance of the service. Can be null if the service is not a singleton
   * or if the service has not been resolved yet.
   *
   * Can only be set by the container.
   */
  public get instance() {
    return this._instance;
  }

  /**
   * Set the instance of this service. This will override the
   * concrete implementation or reset it if null is given.
   */
  public setInstance(instance: any) {
    this._instance = instance;
  }
}

export default ServiceDefinition;
