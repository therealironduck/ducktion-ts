import { expect, describe } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it creates a service definition with default values", ({ container }) => {
  const definition = container.__registerAs("SimpleService", SimpleService);

  expect(definition.serviceType).toBe(SimpleService);
  expect(definition.instance).toBeNullable();
  expect(definition.callback).toBeNullable();
});

describe("instance", () => {
  test("it can set the instance", ({ container }) => {
    const instance = new SimpleService();

    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.setInstance(instance);
    expect(definition.instance).toBe(instance);

    definition.setInstance(undefined);
    expect(definition.instance).toBeNullable();
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
});

describe("callback", () => {
  test("it can set the callback", ({ container }) => {
    const action = () => new SimpleService();

    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.setCallback(action);
    expect(definition.callback).toBe(action);

    definition.setCallback(undefined);
    expect(definition.callback).toBeNullable();
  });

  // TODO: Implement assoon as new service definition method exists
  // test("it can set the callback fluently", ({ container }) => {
  //   const action = () => new SimpleService();
  //
  //   const definition = container.__registerAs("SimpleService", SimpleService);
  //   definition.setCallback(action);
  //   expect(definition.callback).toBe(action);
  //
  //   definition.setCallback(undefined);
  //   expect(definition.callback).toBeNullable();
  // });
});
