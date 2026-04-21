import { DucktionLogger, LogLevelEnum, id, resolve } from "../../src";
import { DUCKTION_LOGGER_TOKEN } from "../../src/core/DucktionLogger";
import SimpleService, { SecondSimpleService } from "./SimpleService";

export class ServiceWithPublicDecorator {
  static __ducktionDependencies = [{ name: "another", token: "SecondSimpleService" }];

  // Pre-transformed: @resolve() → @resolve("SimpleService", SimpleService)
  @resolve("SimpleService", SimpleService)
  public readonly simple!: SimpleService;

  public another: SecondSimpleService;

  public constructor(another: SecondSimpleService) {
    this.another = another;
  }
}

export class ServiceWithPrivateAndProtectedDecorator {
  // Pre-transformed: @resolve() → @resolve("SimpleService", SimpleService)
  @resolve("SimpleService", SimpleService)
  private readonly simple!: SimpleService;

  // Pre-transformed: @resolve() → @resolve("SecondSimpleService", SecondSimpleService)
  @resolve("SecondSimpleService", SecondSimpleService)
  protected another!: SecondSimpleService;

  public get gSimple() {
    return this.simple;
  }

  public get gAnother() {
    return this.another;
  }
}

export class ServiceWithResolveMethod {
  // Pre-transformed: @resolve on hello → __ducktionResolveMethods injection
  static __ducktionResolveMethods = [
    {
      methodKey: "hello",
      dependencies: [
        { name: "simple", token: "SimpleService", concrete: SimpleService },
        { name: "another", token: "SecondSimpleService", concrete: SecondSimpleService },
        { name: "logger", token: DUCKTION_LOGGER_TOKEN, concrete: DucktionLogger },
      ],
    },
  ];

  public simple!: SimpleService;
  public another!: SecondSimpleService;

  @resolve
  public hello(simple: SimpleService, another: SecondSimpleService, logger: DucktionLogger) {
    logger.log(LogLevelEnum.debug, "I was called!");

    this.simple = simple;
    this.another = another;
  }
}

export class ServiceWithPrivateResolveMethod {
  // Pre-transformed: @resolve on hello → __ducktionResolveMethods injection
  static __ducktionResolveMethods = [
    {
      methodKey: "hello",
      dependencies: [
        { name: "simple", token: "SimpleService", concrete: SimpleService },
        { name: "another", token: "SecondSimpleService", concrete: SecondSimpleService },
        { name: "logger", token: DUCKTION_LOGGER_TOKEN, concrete: DucktionLogger },
      ],
    },
  ];

  public simple!: SimpleService;
  public another!: SecondSimpleService;

  @resolve
  private hello(simple: SimpleService, another: SecondSimpleService, logger: DucktionLogger) {
    logger.log(LogLevelEnum.debug, "I was called!");

    this.simple = simple;
    this.another = another;
  }
}

export class ServiceWithIdFields {
  // Pre-transformed: @resolve("simple") → @resolve("SimpleService", SimpleService, "simple")
  @resolve("SimpleService", SimpleService, "simple")
  public simple!: SimpleService;

  // Pre-transformed: @resolve("another") → @resolve("SecondSimpleService", SecondSimpleService, "another")
  @resolve("SecondSimpleService", SecondSimpleService, "another")
  public another!: SecondSimpleService;
}

export class ServiceWithIdConstructorArgument {
  // Pre-transformed: plugin emits id: "simple" in the __ducktionDependencies entry
  static __ducktionDependencies = [
    { name: "simple", token: "SimpleService", concrete: SimpleService, id: "simple" },
    { name: "another", token: "SecondSimpleService", concrete: SecondSimpleService },
  ];

  public simple: SimpleService;
  public another: SecondSimpleService;

  public constructor(@id("simple") simple: SimpleService, another: SecondSimpleService) {
    this.simple = simple;
    this.another = another;
  }
}
