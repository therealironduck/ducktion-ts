import { resolve } from "../../src";
import SimpleService, { SecondSimpleService } from "./SimpleService";

export class ServiceWithPublicDecorator {
  static __ducktionDependencies = [{ name: "another", token: "SecondSimpleService" }];

  // Pre-transformed: @resolve() → @resolve("SimpleService", SimpleService)
  @resolve("SimpleService", SimpleService)
  public readonly simple: SimpleService;

  public another: SecondSimpleService;

  public constructor(another: SecondSimpleService) {
    this.another = another;
  }
}
