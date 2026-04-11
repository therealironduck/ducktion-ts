export class RecursiveAService {
  // This will be set by the Ducktion vite/rolldown plugin
  static __ducktionDependencies = [{ name: "b", token: "RecursiveBService" }];

  public constructor(public readonly b: RecursiveBService) {}
}

export class RecursiveBService {
  static __ducktionDependencies = [{ name: "a", token: "RecursiveAService" }];

  public constructor(public readonly a: RecursiveAService) {}
}

export class RecursiveWrapperService {
  static __ducktionDependencies = [{ name: "a", token: "RecursiveAService" }];

  public constructor(public readonly a: RecursiveAService) {}
}
