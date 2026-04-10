import DiContainer from "@therealironduck/ducktion-ts";

class UnknownService {}

export const result = DiContainer.singleton.resolve<UnknownService>();
