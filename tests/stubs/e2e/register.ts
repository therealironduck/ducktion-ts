import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

class GreetingService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

DiContainer.singleton.register<GreetingService>();
export const result = DiContainer.singleton.resolve<GreetingService>();
