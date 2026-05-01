export const DUCKTION_LOGGER_TOKEN = "@therealironduck/ducktion-ts#DucktionLogger";

export const LogLevel = {
  debug: 0,
  info: 1,
  error: 2,
  disabled: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const LEVEL_LABEL: Record<LogLevel, string> = {
  [LogLevel.debug]: "Debug",
  [LogLevel.info]: "Info",
  [LogLevel.error]: "Error",
  [LogLevel.disabled]: "Disabled",
};

export default class DucktionLogger {
  private logLevel: LogLevel = LogLevel.error;

  public configure(level: LogLevel): void {
    this.logLevel = level;
  }

  public log(level: LogLevel, message: string): void {
    if (this.logLevel > level) {
      return;
    }

    switch (level) {
      case LogLevel.error:
        console.error(`[Ducktion] [${LEVEL_LABEL[level]}] ${message}`);
        break;

      case LogLevel.debug:
      case LogLevel.info:
        console.log(`[Ducktion] [${LEVEL_LABEL[level]}] ${message}`);
        break;
    }
  }
}
