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
