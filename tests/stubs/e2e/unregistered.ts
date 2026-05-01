import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
  newEnableAutoResolve: false,
});

class UnknownService {}

export const result = DiContainer.singleton.resolve<UnknownService>();
