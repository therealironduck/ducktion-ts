interface IMyInterface {
  doSomething(): void;
}

class EventBus {
  register<T>(): void {}
}

const bus = new EventBus();
bus.register<IMyInterface>();
