import DiContainer, { LogLevelEnum, resolve } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

class GreetingService {
  greet() {
    return "hello";
  }
}

class FormalGreetingService {
  greet() {
    return "good day";
  }
}

class Consumer {
  @resolve()
  public default!: GreetingService;

  @resolve("formal")
  public formal!: GreetingService;
}

DiContainer.singleton.register<GreetingService>();
DiContainer.singleton.registerAs<GreetingService, FormalGreetingService>("formal");
DiContainer.singleton.register<Consumer>();

export const result = DiContainer.singleton.resolve<Consumer>();
