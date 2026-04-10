export interface Options {
  // define your plugin options here
}

export type Instantiable = {
  new (...args: any[]): any;
  __ducktionDependencies: Array<{ name: string; token: string }>;
};
