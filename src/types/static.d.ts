/**
 * A small helper type which defines instantiable objects for Ducktion.
 * It contains the `new` operator aswell as the ducktion dependencies which
 * get auto added by the vite/rolldown plugin.
 */
export type Instantiable = {
  new (...args: any[]): any;
  __ducktionDependencies?: DucktionDependencies;
};

/**
 * This type is used for internal resolving. The vite/rollup plugin writes
 * a static array with all dependencies to each class which follows this
 * type.
 */
export type DucktionDependencies = Array<{
  name: string;
  token: string;
  concrete: DucktionDependencies[0] | undefined;
  id?: string;
}>;
