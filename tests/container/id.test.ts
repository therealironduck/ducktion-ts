import { describe, expect } from "vitest";

import { test } from "../base";
import SimpleService, { SecondSimpleService } from "../stubs/SimpleService";

describe("register", () => {
  test("it can register the same service with different ids", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService, "service1");
    container.__registerAs("ISimpleService", SecondSimpleService, "service2");

    expect(container.__resolveByToken("ISimpleService", "service1")).toBeInstanceOf(SimpleService);
    expect(container.__resolveByToken("ISimpleService", "service2")).toBeInstanceOf(SecondSimpleService);
  });

  test("it throws an error if a service with the same id is required twice", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService, "service1");

    expect(() => container.__registerAs("ISimpleService", SecondSimpleService, "service1")).toThrow(
      "Service is already registered.",
    );
  });

  test("it works with the concrete type given", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService, "service1");
    container.__registerAs("ISimpleService", SecondSimpleService, "service2");

    expect(container.__resolveWithType("ISimpleService", SimpleService, "service1")).toBeInstanceOf(SimpleService);
    expect(container.__resolveWithType("ISimpleService", SecondSimpleService, "service2")).toBeInstanceOf(
      SecondSimpleService,
    );
  });

  test("it can mix the same service with and without id", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService);
    container.__registerAs("ISimpleService", SecondSimpleService, "with-id");

    expect(container.__resolveByToken("ISimpleService")).toBeInstanceOf(SimpleService);
    expect(container.__resolveByToken("ISimpleService", "with-id")).toBeInstanceOf(SecondSimpleService);
  });
});

describe("override", () => {
  test("it can override services with ids", ({ container }) => {
    container.__registerAs("ISimpleService", SimpleService, "service123");
    container.__override("ISimpleService", SecondSimpleService, "service123");

    expect(container.__resolveByToken("ISimpleService", "service123")).toBeInstanceOf(SecondSimpleService);
  });
});

/**
		// TODO: E2E test
	*/
