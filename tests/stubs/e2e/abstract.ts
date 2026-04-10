import DiContainer from "@therealironduck/ducktion-ts";

abstract class AbstractService {
  abstract greet(): string;
}

class ConcreteService extends AbstractService {
  greet() {
    return "hello";
  }
}

export function registerAbstract() {
  DiContainer.singleton.register<AbstractService>();
}

export function registerAndResolveConcrete() {
  DiContainer.singleton.register<ConcreteService>();
  return DiContainer.singleton.resolve<ConcreteService>();
}
