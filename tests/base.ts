import { test as baseTest } from "vitest";

import DiContainer from "../src";
import { DUCKTION_LOGGER_TOKEN, LogLevelEnum } from "../src/core/DucktionLogger";
import { ContainerOptions } from "../src/types";
import { FakeLogger } from "./FakeLogger";

export const testWithConfig = (config: Partial<ContainerOptions>) => {
  return baseTest.extend("container", async (): Promise<DiContainer> => {
    const container = new DiContainer();
    container.configure(config);

    return container;
  });
};

export const test = testWithConfig({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: false,
});

export const testWithAutoResolve = testWithConfig({
  newLevel: LogLevelEnum.disabled,
  newEnableAutoResolve: true,
});

export function fakeLogger(container: DiContainer): FakeLogger {
  container.__override(DUCKTION_LOGGER_TOKEN, FakeLogger);
  container.reinitialize();

  return container.__resolveByToken(DUCKTION_LOGGER_TOKEN) as FakeLogger;
}
