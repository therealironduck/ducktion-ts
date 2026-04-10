import DiContainer from "@therealironduck/ducktion-ts";

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export function registerEnum() {
  DiContainer.singleton.register<Direction>();
}
