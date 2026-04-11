export interface Options {
  // define your plugin options here
}

export type DucktionDependencies = Array<{ name: string; token: string }>;

export type Instantiable = {
  new (...args: any[]): any;
  __ducktionDependencies?: DucktionDependencies;
};
