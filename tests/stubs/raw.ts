import DiContainer from "@therealironduck/ducktion-ts";

interface IMyInterface {
  doSomething(): void;
}

interface IOtherService {
  run(): void;
}

DiContainer.singleton.register<IMyInterface>();

const container = DiContainer.singleton;
container.register<IOtherService>();
