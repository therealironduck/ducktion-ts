import DiContainer from "@therealironduck/ducktion-ts";

class GreetingService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

DiContainer.singleton.register<GreetingService>();
export const result = DiContainer.singleton.resolve<GreetingService>();
