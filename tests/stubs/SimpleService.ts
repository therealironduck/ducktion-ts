export abstract class BaseSimpleService implements ISimpleService {
  // This will be set by the Ducktion vite/rollup plugin
  static __ducktionAbstract = true;
}

export default class SimpleService extends BaseSimpleService {}

export class SecondSimpleService implements ISimpleService {}

export interface ISimpleService {}
