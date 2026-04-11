import { SCALAR_TOKEN } from "../../src/plugin/transformConstructorDependencies";

export default class ScalarService {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = [
    {
      name: "scalar",
      token: SCALAR_TOKEN,
    },
  ];

  public constructor(public readonly scalar: number) {}
}
