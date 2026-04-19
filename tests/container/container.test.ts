import { expect, test } from "vitest";

import { DiContainer } from "../../src";
import SimpleService from "../stubs/SimpleService";

test("it can instantiate a new container at runtime", () => {
  const singleton = DiContainer.singleton;

  expect(singleton).not.toBeNullable();
  expect(singleton).toBeInstanceOf(DiContainer);
});

test("it returns the same container everytime", () => {
  let container1 = DiContainer.singleton;
  container1.__registerAs("SimpleService", SimpleService);

  let container2 = DiContainer.singleton;
  const service = container2.__resolveByToken("SimpleService");

  expect(service).not.toBeNullable();
});
