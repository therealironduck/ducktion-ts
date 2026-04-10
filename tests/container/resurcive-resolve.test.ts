import { expect } from "vitest";

import { test } from "../base";
import SimpleService, { ServiceWithDependencies } from "../stubs/SimpleService";

test("it can resolve a service recursively", ({ container }) => {
  container.__registerAs("ISimpleService", SimpleService);
  container.__registerAs("ServiceWithDependencies", ServiceWithDependencies);

  const service = container.__resolveByToken("ServiceWithDependencies");
  expect(service).toBeInstanceOf(ServiceWithDependencies);
  expect(service.service).toBeInstanceOf(SimpleService);

  // TODO: Test when singleton mode is implemented
  // const simple = container.__resolveByToken("ISimpleService");
  // expect(simple).toBe(service.service);
});
