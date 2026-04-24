import DiContainer, { LogLevelEnum, resolve } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

class SimpleService {}

class SecondService {}

class Consumer {
  public simple!: SimpleService;
  public second!: SecondService;

  @resolve
  public init(simple: SimpleService, second: SecondService) {
    this.simple = simple;
    this.second = second;
  }
}

DiContainer.singleton.register<SimpleService>();
DiContainer.singleton.register<SecondService>();
DiContainer.singleton.register<Consumer>();

export const result = DiContainer.singleton.resolve<Consumer>();
