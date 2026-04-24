import DiContainer, { LogLevelEnum, resolve } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

class SimpleService {
  value = "simple";
}

class SecondService {
  value = "second";
}

class Consumer {
  @resolve()
  private simple!: SimpleService;

  @resolve()
  protected second!: SecondService;

  public get gSimple() {
    return this.simple;
  }

  public get gSecond() {
    return this.second;
  }
}

DiContainer.singleton.register<SimpleService>();
DiContainer.singleton.register<SecondService>();
DiContainer.singleton.register<Consumer>();

export const result = DiContainer.singleton.resolve<Consumer>();
