import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

import type SimpleService from "../SimpleService";

DiContainer.singleton.configure({
  newLevel: LogLevel.disabled,
  newEnableAutoResolve: true,
});

class GreetingService {
  public constructor(public service: SimpleService) {}
}

export function registerAndResolveGreetingService() {
  DiContainer.singleton.register<GreetingService>();
  return DiContainer.singleton.resolve<GreetingService>();
}
