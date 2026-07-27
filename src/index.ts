import { id, resolve, resolveTags, preventAutoResolve } from "./core/decorators";
import DiContainer from "./core/DiContainer";
import DucktionLogger, { LogLevel } from "./core/DucktionLogger";
import ServiceDefinition from "./core/ServiceDefinition";

export type {
  ContainerOptions,
  DiConfigurator,
  DucktionDependencies,
  DucktionResolveMethods,
  DucktionResolveParameters,
  DucktionResolveTagsParameters,
  Implementation,
  LazyMode,
  SingletonMode,
} from "./types";

export { DiContainer, ServiceDefinition, DucktionLogger, LogLevel, id, resolve, resolveTags, preventAutoResolve };
export default DiContainer;
