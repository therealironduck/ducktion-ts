import DiContainer from "../../src";
import ScalarService from "./ScalarService";
import SimpleService from "./SimpleService";

export class ExampleConfigurator {
  public called: boolean = false;

  public register(container: DiContainer): void {
    this.called = true;

    container.__registerAs("ISimpleService", SimpleService);
    container.__registerAs("ScalarService", ScalarService, () => new ScalarService(12));
  }

  public name(): string {
    return "Example Configurator";
  }
}
