export abstract class BaseSimpleService implements ISimpleService {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionAbstract = true;
}

export default class SimpleService extends BaseSimpleService {
  public a: number = 20;
}

export class SecondSimpleService implements ISimpleService {}

export interface ISimpleService {}

export class ServiceWithDependencies {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = [{ name: "service", token: "ISimpleService" }];

  public readonly service: ISimpleService;

  public constructor(service: ISimpleService) {
    this.service = service;
  }
}

export class ServiceWithConcreteDependencies {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = [{ name: "service", token: "SecondSimpleService", concrete: SecondSimpleService }];

  public readonly service: SecondSimpleService;

  public constructor(service: SecondSimpleService) {
    this.service = service;
  }
}
