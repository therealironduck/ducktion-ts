import { expect } from "vitest";

import { testWithAutoResolve as test } from "../base";
import SimpleService, {
  SecondSimpleService,
  ServiceWithConcreteDependencies,
  ServiceWithDependencies,
} from "../stubs/SimpleService";

test("it can automatically resolve unknown services", ({ container }) => {
  const result = container.__resolveWithType("SimpleService", SimpleService);

  expect(result).not.toBeNull();
  expect(result).toBeInstanceOf(SimpleService);
});

test("it can automatically resolve unknown services recursively", ({ container }) => {
  const result = container.__resolveWithType("ServiceWithConcreteDependencies", ServiceWithConcreteDependencies);
  expect(result).toBeInstanceOf(ServiceWithConcreteDependencies);

  const resultDep = result as ServiceWithConcreteDependencies;
  expect(resultDep.service).toBeInstanceOf(SecondSimpleService);
});

test("it can automatically resolve with manually registered interfaces", ({ container }) => {
  container.__registerAs("ISimpleService", SimpleService);

  const result = container.__resolveWithType("ServiceWithDependencies", ServiceWithDependencies);
  expect(result).toBeInstanceOf(ServiceWithDependencies);

  const depResult = result as ServiceWithDependencies;
  expect(depResult.service).toBeInstanceOf(SimpleService);
});

test("it stores them as singletons", ({ container }) => {
  const result1 = container.__resolveWithType("SimpleService", SimpleService);
  const result2 = container.__resolveWithType("SimpleService", SimpleService);

  expect(result1).toBe(result2);
});

test("it can optionally not store them as singletons", ({ container }) => {
  container.configure({ newAutoResolveSingletonMode: "non-singleton" });

  const result1 = container.__resolveWithType("SimpleService", SimpleService);
  const result2 = container.__resolveWithType("SimpleService", SimpleService);

  expect(result1).not.toBe(result2);
});
