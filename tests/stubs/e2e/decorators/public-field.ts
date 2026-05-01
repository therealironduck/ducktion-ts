import DiContainer, { LogLevel, resolve } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
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
  public simple!: SimpleService;

  @resolve()
  public second!: SecondService;
}

DiContainer.singleton.register<SimpleService>();
DiContainer.singleton.register<SecondService>();
DiContainer.singleton.register<Consumer>();

export const result = DiContainer.singleton.resolve<Consumer>();
