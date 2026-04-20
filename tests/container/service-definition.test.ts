import { expect, describe } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it creates a service definition with default values", ({ container }) => {
  const definition = container.__registerAs("SimpleService", SimpleService);

  expect(definition.serviceType).toBe(SimpleService);
  expect(definition.instance).toBeNullable();
  expect(definition.callback).toBeNullable();
  expect(definition.lazyMode).toBeNullable();
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

  test("it can set the instance fluently", ({ container }) => {
    const instance = new SimpleService();

    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.setInstance(instance).lazy();
    expect(definition.instance).toBe(instance);
    expect(definition.lazyMode).toBe("lazy");
  });
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

  test("it resets the instance when the callback is set", ({ container }) => {
    const action = () => new SimpleService();
    const instance = new SimpleService();

    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.setInstance(instance);
    definition.setCallback(action);
    expect(definition.callback).toBe(action);
    expect(definition.instance).toBeNullable();
  });

  test("it can set the callback fluently", ({ container }) => {
    const action = () => new SimpleService();

    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.setCallback(action).lazy();
    expect(definition.callback).toBe(action);
    expect(definition.lazyMode).toBe("lazy");
  });
});

describe("lazy", () => {
  test("it can toggle the lazy mode", ({ container }) => {
    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.nonLazy();
    expect(definition.lazyMode).toBe("non-lazy");

    definition.lazy();
    expect(definition.lazyMode).toBe("lazy");

    definition.setLazyMode("non-lazy");
    expect(definition.lazyMode).toBe("non-lazy");
  });

  test("it can toggle the lazy mode fluently", ({ container }) => {
    const definition = container.__registerAs("SimpleService", SimpleService);
    definition.nonLazy().lazy().setLazyMode("non-lazy").lazy();
    expect(definition.lazyMode).toBe("lazy");
  });
});
