import { expect } from "vitest";

import { LogLevelEnum } from "../../../src";
import { fakeLogger, test } from "../../base";
import { ServiceWithResolveMethod } from "../../stubs/DecoratorServices";
import SimpleService, { SecondSimpleService } from "../../stubs/SimpleService";

test("it can resolve any variables after the object already exists", ({ container }) => {
  const logger = fakeLogger(container);

  container.__registerAs("SimpleService", SimpleService);
  container.__registerAs("SecondSimpleService", SecondSimpleService);

  const service = new ServiceWithResolveMethod();
  expect(service.another).toBeNullable();
  expect(service.simple).toBeNullable();

  logger.assertHasNoMessage(LogLevelEnum.debug, "I was called!");

  container.resolveDependencies(service);
  expect(service.another).toBeInstanceOf(SecondSimpleService);
  expect(service.simple).toBeInstanceOf(SimpleService);

  logger.assertHasMessage(LogLevelEnum.debug, "I was called!");
});
