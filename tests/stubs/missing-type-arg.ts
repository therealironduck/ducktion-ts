import DiContainer from "@therealironduck/ducktion-ts";

class MyService {
  run(): void {}
}

DiContainer.singleton.register();
