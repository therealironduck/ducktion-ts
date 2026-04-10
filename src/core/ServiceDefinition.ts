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

  public constructor(serviceType: Instantiable) {
    this.serviceType = serviceType;
  }
}

export default ServiceDefinition;
