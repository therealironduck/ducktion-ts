export abstract class BaseSimpleService implements ISimpleService {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionAbstract = true;
}

export default class SimpleService extends BaseSimpleService {}

export class SecondSimpleService implements ISimpleService {}

export interface ISimpleService {}

export class ServiceWithDependencies {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = ["ISimpleService"];

  public readonly service: ISimpleService;

  public constructor(service: ISimpleService) {
    this.service = service;
  }
}
