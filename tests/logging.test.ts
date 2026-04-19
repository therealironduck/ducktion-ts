import { describe, expect } from "vitest";

import { LogLevelEnum } from "../src/core/DucktionLogger";
import { fakeLogger, test } from "./base";
import { ExampleConfigurator } from "./stubs/ExampleConfigurator";
import { RecursiveAService, RecursiveBService } from "./stubs/RecursiveServices";
import ScalarService from "./stubs/ScalarService";
import SimpleService, { SecondSimpleService, BaseSimpleService } from "./stubs/SimpleService";

describe("general logs", () => {
  test("it logs initializations on the info channel", ({ container }) => {
    fakeLogger(container).assertHasMessage(LogLevelEnum.info, "Reinitialized container");
  });

  test("it logs clears on the info channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.clear();

    logger.assertHasMessage(LogLevelEnum.info, "Clearing container");
  });

  test("it logs resets on the info channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.resetSingletons();

    logger.assertHasMessage(LogLevelEnum.info, "Resetting container");
  });

  test("it logs all used configurators in the info channel", ({ container }) => {
    const logger = fakeLogger(container);
    const configurator = new ExampleConfigurator();

    container.addConfigurator(configurator);
    container.reinitialize();

    logger.assertHasMessage(LogLevelEnum.info, `Using configurator: ${configurator.name()}`);
  });
});

describe("register", () => {
  test("it logs registered services on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("SimpleService", SimpleService);

    logger.assertHasMessage(LogLevelEnum.debug, `Registered service: SimpleService => ${SimpleService.name}`);
  });

  test("it logs an error if the service trying to register already exists", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("SimpleService", SimpleService);
    expect(() => container.__registerAs("SimpleService", SimpleService)).toThrow();

    logger.assertHasMessage(LogLevelEnum.error, "Service 'SimpleService' is already registered");
  });

  test("it logs an error if the service trying to register is abstract", ({ container }) => {
    const logger = fakeLogger(container);

    expect(() => container.__registerAs("BaseSimpleService", BaseSimpleService)).toThrow();

    logger.assertHasMessage(LogLevelEnum.error, "Service 'BaseSimpleService' is abstract");
  });
});

describe("override", () => {
  test("it logs overridden services on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ISimpleService", SimpleService);
    container.__override("ISimpleService", SecondSimpleService);

    logger.assertHasMessage(LogLevelEnum.debug, `Overridden service: ISimpleService => ${SecondSimpleService.name}`);
  });

  test("it logs an error if the service tyring to override doesnt exists", ({ container }) => {
    const logger = fakeLogger(container);

    expect(() => container.__override("ISimpleService", SecondSimpleService)).toThrow();

    logger.assertHasMessage(LogLevelEnum.error, "Service 'ISimpleService' is not registered");
  });
});

describe("resolve", () => {
  test("it logs resolved services on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ISimpleService", SimpleService);
    container.__resolveByToken("ISimpleService");

    logger.assertHasMessage(LogLevelEnum.debug, `Resolved service: ISimpleService => ${SimpleService.name}`);
  });

  test("it logs an error if the service trying to resolve isnt registered", ({ container }) => {
    const logger = fakeLogger(container);

    expect(() => container.__resolveByToken("ISimpleService")).toThrow();

    logger.assertHasMessage(LogLevelEnum.error, "Service 'ISimpleService' is not registered");
  });

  test("it logs an error if a circular dependency was found", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("RecursiveAService", RecursiveAService);
    container.__registerAs("RecursiveBService", RecursiveBService);

    expect(() => container.__resolveByToken("RecursiveAService")).toThrow();

    logger.assertHasMessage(LogLevelEnum.error, "Circular dependency detected for parameter: a");
  });

  test("it logs an error if any parameter cant be resolved", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ScalarService", ScalarService);

    expect(() => container.__resolveByToken("ScalarService")).toThrow();

    logger.assertHasMessage(LogLevelEnum.error, "Service cant resolve parameter, because it is a scalar value");
  });
});
