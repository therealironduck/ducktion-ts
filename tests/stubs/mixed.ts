import DiContainer from "@therealironduck/ducktion-ts";

class MyService {
  run(): void {}
}

interface IOtherService {
  run(): void;
}

class EventBus {
  register<T>(): void {}
}

DiContainer.singleton.register<MyService>();

const bus = new EventBus();
bus.register<IOtherService>();
