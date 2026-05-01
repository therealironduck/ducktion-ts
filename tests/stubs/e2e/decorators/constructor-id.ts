import DiContainer, { LogLevel, id } from "@therealironduck/ducktion-ts";

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
  constructor(
    @id("formal") public formal: GreetingService,
    public default_: GreetingService,
  ) {}
}

DiContainer.singleton.register<GreetingService>();
DiContainer.singleton.registerAs<GreetingService, FormalGreetingService>("formal");
DiContainer.singleton.register<Consumer>();

export const result = DiContainer.singleton.resolve<Consumer>();
