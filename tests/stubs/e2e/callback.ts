import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled, false);

interface IGreetingService {
  greet(): string;
}

class GreetingService implements IGreetingService {
  constructor(public readonly name: string) {}

  greet() {
    return `Hello ${this.name}`;
  }
}

export function overrideWithCallback() {
  DiContainer.singleton.register<GreetingService>();
  DiContainer.singleton.override<GreetingService, GreetingService>(() => new GreetingService("Overridden"));
  return DiContainer.singleton.resolve<GreetingService>();
}

export function overrideInterfaceWithCallback() {
  DiContainer.singleton.registerAs<IGreetingService, GreetingService>();
  DiContainer.singleton.override<IGreetingService, GreetingService>(() => new GreetingService("OverriddenInterface"));
  return DiContainer.singleton.resolve<IGreetingService>();
}

export function registerWithCallback() {
  DiContainer.singleton.register<GreetingService>(() => new GreetingService("World"));
  return DiContainer.singleton.resolve<GreetingService>();
}

export function registerInterfaceWithCallback() {
  DiContainer.singleton.registerAs<IGreetingService, GreetingService>(() => new GreetingService("Interface"));
  return DiContainer.singleton.resolve<IGreetingService>();
}
