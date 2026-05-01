import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
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

const instance = new GreetingService();
DiContainer.singleton.registerAs<IGreetService, GreetingService>();
DiContainer.singleton.override<IGreetService>().setInstance(instance);
export const result = DiContainer.singleton.resolve<IGreetService>();
export const isSameInstance = result === instance;
