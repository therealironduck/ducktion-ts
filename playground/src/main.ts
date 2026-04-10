import DiContainer from "@therealironduck/ducktion-ts";

class GreetingService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

class AnotherService {}

// Register - plugin transforms register<T>() → register("T")
DiContainer.singleton.register<GreetingService>();

// Resolve - plugin transforms resolve<T>() → resolve("T")
export const greeting = DiContainer.singleton.resolve<GreetingService>();

// Resolving an unregistered token should return undefined
export const unregistered = DiContainer.singleton.resolve<AnotherService>();
