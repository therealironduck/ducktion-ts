import { expect } from "vitest";

import { test } from "../base";
import ScalarService from "../stubs/ScalarService";

test("it can bind specific parameters", ({ container }) => {
  container.__registerAs("ScalarService", ScalarService).setParameter("scalar", 24);

  const service = container.__resolveByToken("ScalarService");
  expect(service).toBeInstanceOf(ScalarService);

  const scalarService = service as ScalarService;
  expect(scalarService.scalar).toBe(24);
});
