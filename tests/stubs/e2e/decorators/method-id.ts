import DiContainer, { LogLevel, id, resolve } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
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
  public formal!: GreetingService;
  public default_!: GreetingService;

  @resolve
  public init(@id("formal") formal: GreetingService, default_: GreetingService) {
    this.formal = formal;
    this.default_ = default_;
  }
}

DiContainer.singleton.register<GreetingService>();
DiContainer.singleton.registerAs<GreetingService, FormalGreetingService>("formal");
DiContainer.singleton.register<Consumer>();

export const result = DiContainer.singleton.resolve<Consumer>();
