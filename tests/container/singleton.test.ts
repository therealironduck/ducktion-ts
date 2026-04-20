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

test("it can register some services as non singleton", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).nonSingleton();

  const service1 = container.__resolveByToken("SimpleService");
  const service2 = container.__resolveByToken("SimpleService");

  expect(service1).not.toBe(service2);
});

test("it can change the default singleton mode to non singleton", ({ container }) => {
  container.configure({ newDefaultSingletonMode: "non-singleton" });

  container.__registerAs("SimpleService", SimpleService);

  const service1 = container.__resolveByToken("SimpleService");
  const service2 = container.__resolveByToken("SimpleService");

  expect(service1).not.toBe(service2);
});

test("it can register callback based services as non singleton", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService, () => new SimpleService()).transient();

  const service1 = container.__resolveByToken("SimpleService");
  const service2 = container.__resolveByToken("SimpleService");

  expect(service1).not.toBe(service2);
});

test("it can register callback based services as non singleton with container defaults", ({ container }) => {
  container.configure({ newDefaultSingletonMode: "non-singleton" });

  container.__registerAs("SimpleService", SimpleService, () => new SimpleService());

  const service1 = container.__resolveByToken("SimpleService");
  const service2 = container.__resolveByToken("SimpleService");

  expect(service1).not.toBe(service2);
});
