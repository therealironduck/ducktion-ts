import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled);

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

export function registerAsAndResolveAbstract() {
  DiContainer.singleton.registerAs<AbstractService, ConcreteService>();
  return DiContainer.singleton.resolve<AbstractService>();
}
