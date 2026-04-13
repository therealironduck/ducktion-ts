import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled, false);

class UnknownService {}

export const result = DiContainer.singleton.resolve<UnknownService>();
