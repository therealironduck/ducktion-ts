import DiContainer, { LogLevelEnum } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure(LogLevelEnum.disabled);

class UnknownService {}

export const result = DiContainer.singleton.resolve<UnknownService>();
