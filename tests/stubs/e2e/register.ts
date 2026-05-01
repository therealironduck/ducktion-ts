import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
  newEnableAutoResolve: false,
});

class GreetingService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

DiContainer.singleton.register<GreetingService>();
export const result = DiContainer.singleton.resolve<GreetingService>();
