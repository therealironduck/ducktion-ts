import DiContainer from "@therealironduck/ducktion-ts";

class MyInterface {
  doSomething(): void {}
}

DiContainer.singleton.register<MyInterface>();
