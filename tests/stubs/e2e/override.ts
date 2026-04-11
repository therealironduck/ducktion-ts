import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled);

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

DiContainer.singleton.registerAs<IGreetService, GreetingService>();
DiContainer.singleton.override<IGreetService, FormalGreetingService>();
export const result = DiContainer.singleton.resolve<IGreetService>();
