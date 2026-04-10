import DiContainer from "@therealironduck/ducktion-ts";

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
