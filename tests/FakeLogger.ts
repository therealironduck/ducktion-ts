import { DucktionLogger } from "../src";
import { LogLevel } from "../src/core/DucktionLogger";

export class FakeLogger extends DucktionLogger {
  private messages: [LogLevel, string][] = [];

  public log(level: LogLevel, message: string): void {
    this.messages.push([level, message]);
  }

  public assertHasMessage(level: LogLevel, message: string): void {
    for (let msg of this.messages) {
      if (msg[0] === level && msg[1] === message) {
        return;
      }
    }

    throw new Error(`Expected to find a log message with level '${level}' and message '${message}'`);
  }

  public assertHasNoMessage(level: LogLevel, message: string): void {
    for (let msg of this.messages) {
      if (msg[0] === level && msg[1] === message) {
        throw new Error(
          `Expected to NOT find a log message with level '${level}' and message '${message}', but found one.`,
        );
      }
    }
  }

  public dump(): void {
    console.log(this.messages);
  }
}
