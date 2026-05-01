import { describe, expect } from "vitest";

import { LogLevel } from "../../../src";
import { fakeLogger, test } from "../../base";
import {
  ServiceWithIdConstructorArgument,
  ServiceWithIdFields,
  ServiceWithIdMethodParameters,
  ServiceWithPrivateAndProtectedDecorator,
  ServiceWithPrivateResolveMethod,
  ServiceWithPublicDecorator,
  ServiceWithResolveMethod,
} from "../../stubs/DecoratorServices";
import SimpleService, { SecondSimpleService } from "../../stubs/SimpleService";

describe("usage without id", () => {
  test("it resolves any public field with a resolve decorator when resolving the main service", ({ container }) => {
    container.__registerAs("SimpleService", SimpleService);
    container.__registerAs("SecondSimpleService", SecondSimpleService);
    container.__registerAs("ServiceWithPublicDecorator", ServiceWithPublicDecorator);

    const service = container.__resolveByToken("ServiceWithPublicDecorator");
    expect(service).toBeInstanceOf(ServiceWithPublicDecorator);

    const servicePub = service as ServiceWithPublicDecorator;
    expect(servicePub.another).toBeInstanceOf(SecondSimpleService);
    expect(servicePub.simple).toBeInstanceOf(SimpleService);
  });

  test("it resolves private and protected fields aswell", ({ container }) => {
    container.__registerAs("SimpleService", SimpleService);
    container.__registerAs("SecondSimpleService", SecondSimpleService);
    container.__registerAs("ServiceWithPrivateAndProtectedDecorator", ServiceWithPrivateAndProtectedDecorator);

    const service = container.__resolveByToken("ServiceWithPrivateAndProtectedDecorator");
    expect(service).toBeInstanceOf(ServiceWithPrivateAndProtectedDecorator);

    const servicePub = service as ServiceWithPrivateAndProtectedDecorator;
    expect(servicePub.gAnother).toBeInstanceOf(SecondSimpleService);
    expect(servicePub.gSimple).toBeInstanceOf(SimpleService);
  });

  test("it can resolve and call whole public methods that have the decorator", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("SimpleService", SimpleService);
    container.__registerAs("SecondSimpleService", SecondSimpleService);
    container.__registerAs("ServiceWithResolveMethod", ServiceWithResolveMethod);

    const service = container.__resolveByToken("ServiceWithResolveMethod");
    expect(service).toBeInstanceOf(ServiceWithResolveMethod);

    const serviceRes = service as ServiceWithResolveMethod;
    expect(serviceRes.simple).toBeInstanceOf(SimpleService);
    expect(serviceRes.another).toBeInstanceOf(SecondSimpleService);

    logger.assertHasMessage(LogLevel.debug, "I was called!");
  });

  test("it can resolve and call whole private methods that have the decorator", ({ container }) => {
    const logger = fakeLogger(container);

    container.__registerAs("SimpleService", SimpleService);
    container.__registerAs("SecondSimpleService", SecondSimpleService);
    container.__registerAs("ServiceWithPrivateResolveMethod", ServiceWithPrivateResolveMethod);

    const service = container.__resolveByToken("ServiceWithPrivateResolveMethod");
    expect(service).toBeInstanceOf(ServiceWithPrivateResolveMethod);

    const serviceRes = service as ServiceWithPrivateResolveMethod;
    expect(serviceRes.simple).toBeInstanceOf(SimpleService);
    expect(serviceRes.another).toBeInstanceOf(SecondSimpleService);

    logger.assertHasMessage(LogLevel.debug, "I was called!");
  });
});

describe("usage with ids", () => {
  test("it can resolve specific ids for fields", ({ container }) => {
    const simple1 = new SimpleService();
    const simple2 = new SimpleService();

    const another1 = new SecondSimpleService();
    const another2 = new SecondSimpleService();

    container.__registerAs("SimpleService", SimpleService).setInstance(simple1);
    container.__registerAs("SimpleService", SimpleService, "simple").setInstance(simple2);

    container.__registerAs("SecondSimpleService", SecondSimpleService).setInstance(another1);
    container.__registerAs("SecondSimpleService", SecondSimpleService, "another").setInstance(another2);

    container.__registerAs("ServiceWithIdFields", ServiceWithIdFields);

    const service = container.__resolveByToken("ServiceWithIdFields");
    expect(service).toBeInstanceOf(ServiceWithIdFields);

    const serviceId = service as ServiceWithIdFields;
    expect(serviceId.simple).toBe(simple2);
    expect(serviceId.another).toBe(another2);
  });

  test("it resolves the id-qualified constructor argument when @id is used", ({ container }) => {
    const simple1 = new SimpleService();
    const simple2 = new SimpleService();

    const another = new SecondSimpleService();

    container.__registerAs("SimpleService", SimpleService).setInstance(simple1);
    container.__registerAs("SimpleService", SimpleService, "simple").setInstance(simple2);
    container.__registerAs("SecondSimpleService", SecondSimpleService).setInstance(another);
    container.__registerAs("ServiceWithIdConstructorArgument", ServiceWithIdConstructorArgument);

    const service = container.__resolveByToken("ServiceWithIdConstructorArgument") as ServiceWithIdConstructorArgument;
    expect(service).toBeInstanceOf(ServiceWithIdConstructorArgument);
    expect(service.simple).toBe(simple2);
    expect(service.another).toBe(another);
  });

  test("it resolves the id-qualified method parameters when @id is used", ({ container }) => {
    const simple1 = new SimpleService();
    const simple2 = new SimpleService();

    const another = new SecondSimpleService();

    container.__registerAs("SimpleService", SimpleService).setInstance(simple1);
    container.__registerAs("SimpleService", SimpleService, "simple").setInstance(simple2);
    container.__registerAs("SecondSimpleService", SecondSimpleService).setInstance(another);
    container.__registerAs("ServiceWithIdMethodParameters", ServiceWithIdMethodParameters);

    const service = container.__resolveByToken("ServiceWithIdMethodParameters") as ServiceWithIdMethodParameters;
    expect(service).toBeInstanceOf(ServiceWithIdMethodParameters);
    expect(service.simple).toBe(simple2);
    expect(service.another).toBe(another);
  });
});
