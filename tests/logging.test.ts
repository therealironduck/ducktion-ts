import { describe, expect } from "vitest";

import DucktionLogger, { LogLevel } from "../src/core/DucktionLogger";
import { fakeLogger, test, testWithAutoResolve } from "./base";
import { ExampleConfigurator } from "./stubs/ExampleConfigurator";
import { RecursiveAService, RecursiveBService } from "./stubs/RecursiveServices";
import ScalarService from "./stubs/ScalarService";
import { ServiceWithNoAutoResolve } from "./stubs/ServiceWithNoAutoResolve";
import SimpleService, { SecondSimpleService, BaseSimpleService } from "./stubs/SimpleService";

describe("general logs", () => {
  test("it logs initializations on the info channel", ({ container }) => {
    fakeLogger(container).assertHasMessage(LogLevel.info, "Reinitialized container");
  });

  test("it logs clears on the info channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.clear();

    logger.assertHasMessage(LogLevel.info, "Clearing container");
  });

  test("it logs resets on the info channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.resetSingletons();

    logger.assertHasMessage(LogLevel.info, "Resetting container");
  });

  test("it logs all used configurators in the info channel", ({ container }) => {
    const logger = fakeLogger(container);
    const configurator = new ExampleConfigurator();

    container.addConfigurator(configurator);
    container.reinitialize();

    logger.assertHasMessage(LogLevel.info, `Using configurator: ${configurator.name()}`);
  });
});

describe("register", () => {
  test("it logs registered services on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("SimpleService", SimpleService);

    logger.assertHasMessage(LogLevel.debug, `Registered service: SimpleService => ${SimpleService.name}`);
  });

  test("it logs an error if the service trying to register already exists", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("SimpleService", SimpleService);
    expect(() => container.__registerAs("SimpleService", SimpleService)).toThrow();

    logger.assertHasMessage(LogLevel.error, "Service 'SimpleService' is already registered");
  });

  test("it logs an error if the service trying to register is abstract", ({ container }) => {
    const logger = fakeLogger(container);

    // @ts-expect-error - Typescript throws error when abstract class is given
    expect(() => container.__registerAs("BaseSimpleService", BaseSimpleService)).toThrow();

    logger.assertHasMessage(LogLevel.error, "Service 'BaseSimpleService' is abstract");
  });
});

describe("override", () => {
  test("it logs overridden services on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ISimpleService", SimpleService);
    container.__override("ISimpleService", SecondSimpleService);

    logger.assertHasMessage(LogLevel.debug, `Overridden service: ISimpleService => ${SecondSimpleService.name}`);
  });

  test("it logs overriding metadata only on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ISimpleService", SimpleService);
    container.__override("ISimpleService");

    logger.assertHasMessage(LogLevel.debug, "Overridden service (metadata only): ISimpleService");
  });

  test("it logs an error if the service tyring to override doesnt exists", ({ container }) => {
    const logger = fakeLogger(container);

    expect(() => container.__override("ISimpleService", SecondSimpleService)).toThrow();

    logger.assertHasMessage(LogLevel.error, "Service 'ISimpleService' is not registered");
  });
});

describe("resolve", () => {
  test("it logs resolved services on the debug channel", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ISimpleService", SimpleService);
    container.__resolveByToken("ISimpleService");

    logger.assertHasMessage(LogLevel.debug, `Resolved service: ISimpleService => ${SimpleService.name}`);
  });

  test("it logs an error if the service trying to resolve isnt registered", ({ container }) => {
    const logger = fakeLogger(container);

    expect(() => container.__resolveByToken("ISimpleService")).toThrow();

    logger.assertHasMessage(LogLevel.error, "Service 'ISimpleService' is not registered");
  });

  test("it logs an error if a circular dependency was found", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("RecursiveAService", RecursiveAService);
    container.__registerAs("RecursiveBService", RecursiveBService);

    expect(() => container.__resolveByToken("RecursiveAService")).toThrow();

    logger.assertHasMessage(LogLevel.error, "Circular dependency detected for parameter: a");
  });

  test("it logs an error if any parameter cant be resolved", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("ScalarService", ScalarService);

    expect(() => container.__resolveByToken("ScalarService")).toThrow();

    logger.assertHasMessage(LogLevel.error, "Service cant resolve parameter, because it is a scalar value");
  });

  testWithAutoResolve("it logs an error if any service is being prevented from auto resolving", ({ container }) => {
    const logger = fakeLogger(container);

    expect(() => container.__resolveWithType("ServiceWithNoAutoResolve", ServiceWithNoAutoResolve)).toThrow();

    logger.assertHasMessage(
      LogLevel.error,
      "Service is restricted from being auto resolved. Explicitly register it instead.",
    );
  });
});

describe("service", () => {
  testWithAutoResolve("it prevents the ducktion logger from being auto resolved", ({ container }) => {
    // @ts-expect-error `services` is private and in a real situation this could never happen
    container.services.clear();

    expect(() => container.__resolveWithType("DucktionLogger", DucktionLogger)).toThrow();
  });
});
