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

DiContainer.singleton.registerAs<IGreetService, GreetingService>();
export const result = DiContainer.singleton.resolve<IGreetService>();
