import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
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
