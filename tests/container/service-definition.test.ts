import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it creates a service definition with default values", ({ container }) => {
  const definition = container.__registerAs("SimpleService", SimpleService);

  expect(definition.serviceType).toBe(SimpleService);
});

test("it can set the instance", ({ container }) => {
  const instance = new SimpleService();

  const definition = container.__registerAs("SimpleService", SimpleService);
  definition.setInstance(instance);
  expect(definition.instance).toBe(instance);

  definition.setInstance(null);
  expect(definition.instance).toBeNull();
});

// TODO: Implement assoon as new service definition method exists
// test("it can set the instance fluently", ({container}) => {
//   const instance = new SimpleService();
//
//   const definition = container.__registerAs("SimpleService", SimpleService);
//   definition.setInstance(instance).lazy();
//   expect(definition.instance).toBe(instance);
//   expect(definition.lazyMode).toBe('lazy')
// })
