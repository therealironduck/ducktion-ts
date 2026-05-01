import { describe, expect } from "vitest";

import { test } from "../base";
import SimpleService, { BaseSimpleService, ISimpleService } from "../stubs/SimpleService";

test("it can register a simple service and resolve it", ({ container }) => {
  // Note: You can use `container.register<SimpleService>()` for better type safety
  container.__registerAs("SimpleService", SimpleService);

  const service = container.__resolveByToken("SimpleService");
  expect(service).toBeInstanceOf(SimpleService);
});

test("it can register a service for an interface and resolve it", ({ container }) => {
  // Note: You can use `container.RegisterAs<ISimpleInterface, SimpleService>()` for better type saftey
  container.__registerAs("ISimpleInterface", SimpleService);

  const service = container.__resolveByToken("ISimpleInterface");
  expect(service).toBeInstanceOf(SimpleService);
});

describe("error handling", () => {
  test("it throws an error if the `register<T>` method is used without the plugin", ({ container }) => {
    expect(() => container.register<SimpleService>()).toThrow();
  });

  test("it throws an error if the `registerAs<T, T2>` method is used without the plugin", ({ container }) => {
    expect(() => container.registerAs<ISimpleService, SimpleService>()).toThrow();
  });

  test("it throws an error if the `resolve<T>` method is used without the plugin", ({ container }) => {
    expect(() => container.resolve<SimpleService>()).toThrow();
  });

  test("it throws an error if the service is unknown", ({ container }) => {
    expect(() => container.__resolveByToken("SimpleService")).toThrow("Service is not registered");
  });

  test("it throws an error if the registered service is abstract", ({ container }) => {
    // @ts-expect-error - Typescript throws error when abstract class is given
    expect(() => container.__registerAs("SimpleService", BaseSimpleService)).toThrow("Service is abstract");
  });

  test("it throws an error if the registered service is not a class at all", ({ container }) => {
    // @ts-expect-error - Typescript throws error when scalar value is given
    expect(() => container.__registerAs("SimpleService", 10)).toThrow("Service is not instantiable");
  });

  test("it throws an error if the service is already registered", ({ container }) => {
    container.__registerAs("SimpleService", SimpleService);

    expect(() => container.__registerAs("SimpleService", SimpleService)).toThrow(
      "Service is already registered. Use `override` to override the service",
    );

    container.__registerAs("ISimpleService", SimpleService);

    expect(() => container.__registerAs("ISimpleService", SimpleService)).toThrow(
      "Service is already registered. Use `override` to override the service",
    );
  });
});
