import { expect } from "vitest";

import { testWithAutoResolve } from "../base";
import { ServiceWithNoAutoResolve } from "../stubs/ServiceWithNoAutoResolve";

testWithAutoResolve("it can protect services from being auto resolved", ({ container }) => {
  expect(() => container.__resolveWithType("ServiceWithNoAutoResolve", ServiceWithNoAutoResolve)).toThrow(
    "Service is restricted from being auto resolved. Explicitly register it instead.",
  );
});

testWithAutoResolve("it still allows protected services from being registered manually", ({ container }) => {
  container.__registerAs("ServiceWithNoAutoResolve", ServiceWithNoAutoResolve);

  const service = container.__resolveByToken("ServiceWithNoAutoResolve");
  expect(service).toBeInstanceOf(ServiceWithNoAutoResolve);
});
