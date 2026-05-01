import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
  newEnableAutoResolve: false,
});

interface ILoggerService {
  log(message: string): void;
}

class LoggerService implements ILoggerService {
  log(message: string) {
    console.log(message);
  }
}

class AppService {
  constructor();
  constructor(public readonly logger?: ILoggerService) {}
}

DiContainer.singleton.registerAs<ILoggerService, LoggerService>();
DiContainer.singleton.register<AppService>();

export const result = DiContainer.singleton.resolve<AppService>();
