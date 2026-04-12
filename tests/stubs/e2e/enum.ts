import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled, false);

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export function registerEnum() {
  DiContainer.singleton.register<Direction>();
}
