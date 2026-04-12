import { test as baseTest } from "vitest";

import DiContainer from "../src";
import { DUCKTION_LOGGER_TOKEN, LogLevel, LogLevelEnum } from "../src/core/DucktionLogger";
import { FakeLogger } from "./FakeLogger";

export type DucktionTestConfig = {
  logLevel: LogLevel;
  enableAutoResolve: boolean;
};

export const testWithConfig = (config: DucktionTestConfig) => {
  return baseTest.extend("container", async (): Promise<DiContainer> => {
    const container = new DiContainer();
    container.configure(config.logLevel, config.enableAutoResolve);

    return container;
  });
};

export const test = testWithConfig({
  logLevel: LogLevelEnum.disabled,
  enableAutoResolve: false,
});

export const testWithAutoResolve = testWithConfig({
  logLevel: LogLevelEnum.disabled,
  enableAutoResolve: true,
});

export function fakeLogger(container: DiContainer): FakeLogger {
  container.__override(DUCKTION_LOGGER_TOKEN, FakeLogger);
  container.reinitialize();

  return container.__resolveByToken(DUCKTION_LOGGER_TOKEN) as FakeLogger;
}
