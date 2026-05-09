import { preventAutoResolve } from "../../src/core/decorators";

@preventAutoResolve
export class ServiceWithNoAutoResolve {}
