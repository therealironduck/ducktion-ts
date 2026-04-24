/**
 * This type is used to define if a service is a singleton or not.
 */
export type SingletonMode = "singleton" | "non-singleton";

/**
 * This type is used to define the lazy mode of a service. Lazy means that the service
 * will be instantiated only when it is requested. NonLazy means that the service will
 * be instantiated when the container is initialized.
 */
export type LazyMode = "non-lazy" | "lazy";
