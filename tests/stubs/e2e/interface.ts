import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled, false);

interface IGreetingService {
  greet(): string;
}

class GreetingService implements IGreetingService {
  greet() {
    return "hello";
  }
}

export function registerInterface() {
  DiContainer.singleton.register<IGreetingService>();
}

export function registerAsAndResolveInterface() {
  DiContainer.singleton.registerAs<IGreetingService, GreetingService>();
  return DiContainer.singleton.resolve<IGreetingService>();
}
