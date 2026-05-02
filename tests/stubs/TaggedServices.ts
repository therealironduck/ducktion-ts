import { resolveTags } from "../../src";
import { SecondSimpleService } from "./SimpleService";

export class ServiceWithPublicTagged {
  static __ducktionDependencies = [{ name: "another", token: "SecondSimpleService", concrete: SecondSimpleService }];

  @resolveTags("example")
  public readonly services!: object[];

  public constructor(public readonly another: SecondSimpleService) {}
}
