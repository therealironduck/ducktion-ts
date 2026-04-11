import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it registeres any service as a singleton by default", ({ container }) => {
  // We register any service
  container.__registerAs("SimpleService", SimpleService);

  // We resolve the service twice
  const service1 = container.__resolveByToken("SimpleService");
  const service2 = container.__resolveByToken("SimpleService");

  // We check that both services are the same
  expect(service1).toBe(service2);
});

test("it can reset all singletons", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);
  const serviceA = container.__resolveByToken("SimpleService");

  container.resetSingletons();

  const serviceB = container.__resolveByToken("SimpleService");
  expect(serviceA).not.toBe(serviceB);
});
