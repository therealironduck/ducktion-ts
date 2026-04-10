import { describe, expect } from "vitest";

import { test } from "../base";
import ScalarService from "../stubs/ScalarService";
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

describe("error handling", () => {
  test("it throws an error if the parameters cant be resolved", ({ container }) => {
    container.__registerAs("ServiceWithDependencies", ServiceWithDependencies);

    expect(() => container.__resolveByToken("ServiceWithDependencies")).toThrow(
      "Parameter 'service' could not be resolved",
    );
  });

  test("it throws an error if the parameters can be resolved because of scalar parameters", ({ container }) => {
    container.__registerAs("ScalarService", ScalarService);

    expect(() => container.__resolveByToken("ScalarService")).toThrow("Parameter 'scalar' could not be resolved");
  });
});
