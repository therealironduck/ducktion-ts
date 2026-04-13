import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled, false);

class GreetingService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

DiContainer.singleton.register<GreetingService>();
export const result = DiContainer.singleton.resolve<GreetingService>();
