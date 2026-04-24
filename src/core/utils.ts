/**
 * This method allows to access static variables from any given class instance.
 */
export function getStatic<T>(instance: object, key: string): T {
  const ctor = (instance as any).constructor as Record<string, unknown>;
  return ctor[key] as T;
}
