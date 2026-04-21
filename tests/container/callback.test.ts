import { expect } from "vitest";

import { test } from "../base";
import ScalarService from "../stubs/ScalarService";

test("it can bind callbacks which get used to resolve", ({ container }) => {
  let called = false;
  const action = () => {
    called = true;
    return new ScalarService(123);
  };

  container.__registerAs("ScalarService", ScalarService).setCallback(action);
  expect(called).toBeFalsy();

  const service = container.__resolveByToken("ScalarService");
  expect(called).toBeTruthy();
  expect(service).toBeInstanceOf(ScalarService);

  const scalar = service as ScalarService;
  expect(scalar.scalar).toEqual(123);
});

test("it can override callbacks without existing instances", ({ container }) => {
  const action = () => new ScalarService(123);
  container.__registerAs("ScalarService", ScalarService);

  container.__override("ScalarService", ScalarService).setCallback(action);

  const service = container.__resolveByToken("ScalarService");
  const scalarService = service as ScalarService;

  expect(scalarService.scalar).toBe(123);
});

test("it can override callbacks with existing instance", ({ container }) => {
  const action = () => new ScalarService(123);
  const existing = new ScalarService(42);

  container.__registerAs("ScalarService", ScalarService).setInstance(existing);

  container.__override("ScalarService", ScalarService).setCallback(action);

  const service = container.__resolveByToken("ScalarService");
  const scalarService = service as ScalarService;

  expect(scalarService.scalar).toBe(123);
});

test("it stores the callback results as singletons by default", ({ container }) => {
  let calledCount = 0;
  const service = new ScalarService(123);

  const action = () => {
    calledCount++;
    return service;
  };

  container.__registerAs("ScalarService", ScalarService).setCallback(action);

  const service1 = container.__resolveByToken("ScalarService");
  expect(calledCount).toBe(1);

  const service2 = container.__resolveByToken("ScalarService");
  expect(calledCount).toBe(1);

  expect(service1).toBe(service2);
});
