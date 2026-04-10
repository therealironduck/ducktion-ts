import { expect } from "vitest";

import { test } from "../base";
import SimpleService, { ISimpleService } from "../stubs/SimpleService";

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
