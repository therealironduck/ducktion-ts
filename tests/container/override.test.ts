import { expect } from "vitest";

import { test } from "../base";
import SimpleService, { SecondSimpleService } from "../stubs/SimpleService";

test("it can override any service", ({ container }) => {
  container.__registerAs("ISimpleService", SimpleService);

  const service = container.__resolveByToken("ISimpleService");
  expect(service).toBeInstanceOf(SimpleService);

  container.__override("ISimpleService", SecondSimpleService);

  const secondService = container.__resolveByToken("ISimpleService");
  expect(secondService).toBeInstanceOf(SecondSimpleService);
});
