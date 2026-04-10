import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test.only("it can register a simple service and resolve it", ({ container }) => {
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
