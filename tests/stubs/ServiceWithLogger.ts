import { DucktionLogger, LogLevelEnum } from "../../src";
import { DUCKTION_LOGGER_TOKEN } from "../../src/core/DucktionLogger";

export class ServiceWithLogger {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = [{ name: "logger", token: DUCKTION_LOGGER_TOKEN }];

  constructor(logger: DucktionLogger) {
    logger.log(LogLevelEnum.debug, "Hello from ServiceWithLogger!");
  }
}

export class SecondServiceWithLogger {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = [{ name: "logger", token: DUCKTION_LOGGER_TOKEN }];

  constructor(logger: DucktionLogger) {
    logger.log(LogLevelEnum.debug, "Hello from SecondServiceWithLogger!");
  }
}
