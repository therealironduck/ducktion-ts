import { resolveTags } from "../../src";
import { SecondSimpleService } from "./SimpleService";

export class ServiceWithPublicTagged {
  static __ducktionDependencies = [{ name: "another", token: "SecondSimpleService", concrete: SecondSimpleService }];

  @resolveTags("example")
  public readonly services!: object[];

  public constructor(public readonly another: SecondSimpleService) {}
}

export class ServiceWithTagConstructorArguments {
  static __ducktionDependencies = [{ name: "simple", token: "ducktion__tag", tag: "example" }];

  public constructor(@resolveTags("example") public readonly simple: object[]) {}
}
