/**
 * This decorator will prevent any service from being automatically resolved.
 * Meaning the service needs to be registered explicitly. This can be helpful if the service
 * has parameters that cannot be resolved smartly.
 *
 * As an example within the core, see the "ServiceDefinition" class.
 */
export function preventAutoResolve(constructor: Function): void {
  constructor.prototype.__ducktionPreventAutoResolve = true;
}
