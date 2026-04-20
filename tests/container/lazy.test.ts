import { LogLevelEnum } from "../../src";
import { fakeLogger, test } from "../base";
import { SecondServiceWithLogger, ServiceWithLogger } from "../stubs/ServiceWithLogger";

test("it can register a service as non lazy", ({ container }) => {
  const logger = fakeLogger(container);

  container.__registerAs("ServiceWithLogger", ServiceWithLogger).nonLazy();
  container.__registerAs("SecondServiceWithLogger", SecondServiceWithLogger);
  container.reinitialize();

  logger.assertHasMessage(LogLevelEnum.debug, "Hello from ServiceWithLogger!");
  logger.assertHasNoMessage(LogLevelEnum.debug, "Hello from SecondServiceWithLogger!");
});

test("it can set the default to non-lazy", ({ container }) => {
  const logger = fakeLogger(container);

  container.configure({ newDefaultLazyMode: "non-lazy" });

  container.__registerAs("ServiceWithLogger", ServiceWithLogger);
  container.__registerAs("SecondServiceWithLogger", SecondServiceWithLogger);
  container.reinitialize();

  logger.assertHasMessage(LogLevelEnum.debug, "Hello from ServiceWithLogger!");
  logger.assertHasMessage(LogLevelEnum.debug, "Hello from SecondServiceWithLogger!");
});

test("it can set the default to non-lazy but register specific services as lazy", ({ container }) => {
  const logger = fakeLogger(container);

  container.configure({ newDefaultLazyMode: "non-lazy" });

  container.__registerAs("ServiceWithLogger", ServiceWithLogger).lazy();
  container.__registerAs("SecondServiceWithLogger", SecondServiceWithLogger);
  container.reinitialize();

  logger.assertHasNoMessage(LogLevelEnum.debug, "Hello from ServiceWithLogger!");
  logger.assertHasMessage(LogLevelEnum.debug, "Hello from SecondServiceWithLogger!");
});

test("it can mark a service as lazy afterwards", ({ container }) => {
  const logger = fakeLogger(container);

  container.__registerAs("ServiceWithLogger", ServiceWithLogger);
  container.__override("ServiceWithLogger", ServiceWithLogger).nonLazy();
  container.reinitialize();

  logger.assertHasMessage(LogLevelEnum.debug, "Hello from ServiceWithLogger!");
});
