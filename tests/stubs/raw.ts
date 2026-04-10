import DiContainer from "@therealironduck/ducktion-ts";

class MyInterface {
  doSomething(): void {}
}

class OtherService {
  run(): void {}
}

DiContainer.singleton.register<MyInterface>();

const container = DiContainer.singleton;
container.register<OtherService>();
