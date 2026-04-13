import { describe, expect } from "vitest";

import { test } from "../base";
import { RecursiveAService, RecursiveBService, RecursiveWrapperService } from "../stubs/RecursiveServices";
import ScalarService from "../stubs/ScalarService";
import SimpleService, {
  SecondSimpleService,
  ServiceWithConcreteDependencies,
  ServiceWithDependencies,
} from "../stubs/SimpleService";

test("it can resolve a service recursively", ({ container }) => {
  container.__registerAs("ISimpleService", SimpleService);
  container.__registerAs("ServiceWithDependencies", ServiceWithDependencies);

  const service = container.__resolveByToken("ServiceWithDependencies");
  expect(service).toBeInstanceOf(ServiceWithDependencies);
  expect(service.service).toBeInstanceOf(SimpleService);

  const simple = container.__resolveByToken("ISimpleService");
  expect(simple).toBe(service.service);
});

test("it can resolve a service recursively if the type is an interface", ({ container }) => {
  container.__registerAs("ISimpleService", ServiceWithConcreteDependencies);
  container.__registerAs("SecondSimpleService", SecondSimpleService);

  const service = container.__resolveByToken("ISimpleService");
  expect(service).toBeInstanceOf(ServiceWithConcreteDependencies);
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

  test("it throws an error if there are circular dependencies", ({ container }) => {
    container.__registerAs("RecursiveAService", RecursiveAService);
    container.__registerAs("RecursiveBService", RecursiveBService);
    container.__registerAs("RecursiveWrapperService", RecursiveWrapperService);

    const check = (token: string, parameter: string, secondParameter: string, isWrapper = false) => {
      let caughtError;
      try {
        container.__resolveByToken(token);
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(Error);

      const caughtErrorError = caughtError as Error;

      expect(caughtErrorError.message).toBe(`Parameter '${parameter}' could not be resolved`);
      expect(caughtErrorError.cause).toBeInstanceOf(Error);

      if (!isWrapper) {
        const causeError = caughtErrorError.cause as Error;
        expect(causeError.message).toBe(`Circular dependency detected for parameter '${secondParameter}'`);
        expect(causeError.cause).toBeNullable();
        return;
      }

      const causeError = caughtErrorError.cause as Error;
      expect(causeError.message).toBe(`Parameter '${secondParameter}' could not be resolved`);
      expect(causeError.cause).toBeInstanceOf(Error);

      const causeCauseError = causeError.cause as Error;
      expect(causeCauseError.message).toBe(`Circular dependency detected for parameter '${parameter}'`);
      expect(causeCauseError.cause).toBeNullable();
    };

    check("RecursiveAService", "b", "a");
    check("RecursiveBService", "a", "b");
    check("RecursiveWrapperService", "a", "b", true);
  });
});
