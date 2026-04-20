import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export function registerEnum() {
  DiContainer.singleton.register<Direction>();
}
