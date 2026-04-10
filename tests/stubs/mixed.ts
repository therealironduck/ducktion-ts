import DiContainer from "@therealironduck/ducktion-ts";

interface IMyService {
  run(): void;
}

interface IOtherService {
  run(): void;
}

class EventBus {
  register<T>(): void {}
}

DiContainer.singleton.register<IMyService>();

const bus = new EventBus();
bus.register<IOtherService>();
