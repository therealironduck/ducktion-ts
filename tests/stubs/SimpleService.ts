export abstract class BaseSimpleService {
  // This will be set by the Ducktion vite/rollup plugin
  static __ducktionAbstract = true;
}

export default class SimpleService extends BaseSimpleService implements ISimpleService {}

export class SecondSimpleService implements ISimpleService {}

export interface ISimpleService {}
