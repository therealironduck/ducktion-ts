import type DiContainer from "./core/DiContainer";

export interface Options {
  // define your plugin options here
}

export type DucktionDependencies = Array<{
  name: string;
  token: string;
  concrete: DucktionDependencies[0] | undefined;
}>;

export type Instantiable = {
  new (...args: any[]): any;
  __ducktionDependencies?: DucktionDependencies;
};

export type SingletonMode = "singleton" | "non-singleton";

export type DiConfigurator = {
  /**
   * In this method you may use the container to register your dependencies.
   * Please note that you should not use the container to resolve dependencies at
   * this stage, as it may not be fully configured yet.
   */
  register(container: DiContainer): void;

  /**
   * This method should return a readable name for debugging and logging.
   */
  name(): string;
};
