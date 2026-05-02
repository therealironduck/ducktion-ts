import DiContainer, { LogLevel, resolve, resolveTags } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
  newEnableAutoResolve: false,
});

class TaggedA {
  name = "TaggedA";
}

class TaggedB {
  name = "TaggedB";
}

class Consumer {
  public services!: object[];

  @resolve
  public init(@resolveTags("example") services: object[]) {
    this.services = services;
  }
}

DiContainer.singleton.register<TaggedA>().withTag("example");
DiContainer.singleton.register<TaggedB>().withTag("example");
DiContainer.singleton.register<Consumer>();

const consumer = DiContainer.singleton.resolve<Consumer>();
export const result = consumer.services;
