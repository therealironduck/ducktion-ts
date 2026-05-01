import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
  newEnableAutoResolve: false,
});

class ScalarService {
  public constructor(public readonly scalar: number) {}
}

DiContainer.singleton.register<ScalarService>().setParameter("scalar", 24);
export const result = DiContainer.singleton.resolve<ScalarService>();
