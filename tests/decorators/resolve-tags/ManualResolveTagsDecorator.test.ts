import { expect } from "vitest";

import { test } from "../../base";
import SimpleService, { SecondSimpleService } from "../../stubs/SimpleService";
import { ServiceWithTagMethodParameters } from "../../stubs/TaggedServices";

test("it can resolve any tagged services after the object already exists", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example");
  container.__registerAs("SecondSimpleService", SecondSimpleService).withTag("example");

  const service = new ServiceWithTagMethodParameters();
  container.resolveDependencies(service);

  expect(service.services).not.toBeNullable();
  expect(service.services.length).toBe(2);
});
