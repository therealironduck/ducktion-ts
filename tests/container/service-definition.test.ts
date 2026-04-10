import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it creates a service definition with default values", ({ container }) => {
  const definition = container.__registerAs("SimpleService", SimpleService);

  expect(definition.serviceType).toBe(SimpleService);
});
