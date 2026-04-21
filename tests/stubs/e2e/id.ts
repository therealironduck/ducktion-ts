import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

interface IGreetService {
  greet(name: string): string;
}

class GreetingService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

class FormalGreetingService {
  greet(name: string) {
    return `Good day, ${name}`;
  }
}

class CasualGreetingService {
  greet(name: string) {
    return `Hey ${name}`;
  }
}

// register<T>(id) — same concrete type registered under two different ids
DiContainer.singleton.register<GreetingService>("greeting-a");
DiContainer.singleton.register<GreetingService>("greeting-b");

// registerAs<Token, Impl>(id) — same interface, two different implementations
DiContainer.singleton.registerAs<IGreetService, FormalGreetingService>("formal");
DiContainer.singleton.registerAs<IGreetService, CasualGreetingService>("casual");

// override<Token, Impl>(id) — replace one of the id-scoped registrations
DiContainer.singleton.override<IGreetService, GreetingService>("casual");

// resolve<ConcreteClass>(id)
export const byConcreteA = DiContainer.singleton.resolve<GreetingService>("greeting-a");
export const byConcreteB = DiContainer.singleton.resolve<GreetingService>("greeting-b");

// resolve<Interface>(id)
export const byInterfaceFormal = DiContainer.singleton.resolve<IGreetService>("formal");
export const byInterfaceCasual = DiContainer.singleton.resolve<IGreetService>("casual");
