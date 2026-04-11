import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it can clear a container", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);

  const service = container.__resolveByToken("SimpleService");
  expect(service).not.toBeNullable();

  container.clear();

  expect(() => container.__resolveByToken("SimpleService")).toThrow();
});

test("it clears all singleton instances", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);
  const serviceA = container.__resolveByToken("SimpleService");

  container.clear();

  container.__registerAs("SimpleService", SimpleService);
  const serviceB = container.__resolveByToken("SimpleService");

  expect(serviceA).not.toBe(serviceB);
});

test("it can only reset the singletons", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);
  const serviceA = container.__resolveByToken("SimpleService");

  container.resetSingletons();

  const serviceB = container.__resolveByToken("SimpleService");
  expect(serviceA).not.toBe(serviceB);
});
