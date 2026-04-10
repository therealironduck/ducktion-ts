import { describe, expect } from "vitest";

import { test } from "../base";
import SimpleService, { BaseSimpleService, ISimpleService, SecondSimpleService } from "../stubs/SimpleService";

test("it can override any service", ({ container }) => {
  container.__registerAs("ISimpleService", SimpleService);

  const service = container.__resolveByToken("ISimpleService");
  expect(service).toBeInstanceOf(SimpleService);

  container.__override("ISimpleService", SecondSimpleService);

  const secondService = container.__resolveByToken("ISimpleService");
  expect(secondService).toBeInstanceOf(SecondSimpleService);
});

describe("error handling", () => {
  test("it throws an error if the `override<T, T2>` method is used without the plugin", ({ container }) => {
    expect(() => container.override<ISimpleService, SimpleService>()).toThrow();
  });

  test("it throws an error if the overridden service is abstract", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService);

    expect(() => container.__override("ISimpleService", BaseSimpleService)).toThrow("Service is abstract");
  });

  test("it throws an error if the overridden service is not a class at all", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService);

    expect(() => container.__override("ISimpleService", 10)).toThrow("Service is not instantiable");
  });

  test("it throws an error if the service wasnt registered before", ({ container }) => {
    expect(() => container.__override("ISimpleService", SimpleService)).toThrow(
      "Service is not registered. Use `register` to register the service",
    );
  });
});
