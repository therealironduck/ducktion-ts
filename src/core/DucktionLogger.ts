export const DUCKTION_LOGGER_TOKEN = "@therealironduck/ducktion-ts#DucktionLogger";

export const LogLevelEnum = {
  debug: 0,
  info: 1,
  error: 2,
  disabled: 4,
} as const;

export type LogLevel = (typeof LogLevelEnum)[keyof typeof LogLevelEnum];

const LEVEL_LABEL: Record<LogLevel, string> = {
  [LogLevelEnum.debug]: "Debug",
  [LogLevelEnum.info]: "Info",
  [LogLevelEnum.error]: "Error",
  [LogLevelEnum.disabled]: "Disabled",
};

export default class DucktionLogger {
  private logLevel: LogLevel = LogLevelEnum.error;

  public configure(level: LogLevel): void {
    this.logLevel = level;
  }

  public log(level: LogLevel, message: string): void {
    if (this.logLevel > level) {
      return;
    }

    switch (level) {
      case LogLevelEnum.error:
        console.error(`[Ducktion] [${LEVEL_LABEL[level]}] ${message}`);
        break;

      case LogLevelEnum.debug:
      case LogLevelEnum.info:
        console.log(`[Ducktion] [${LEVEL_LABEL[level]}] ${message}`);
        break;
    }
  }
}
