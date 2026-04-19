import { expect } from "vitest";

import { test } from "../base";
import { ExampleConfigurator } from "../stubs/ExampleConfigurator";

test("it runs every registered configurator on startup", ({ container }) => {
  const configurator = new ExampleConfigurator();
  container.addConfigurator(configurator);
  container.reinitialize();

  expect(configurator.called).toBeTruthy();

  expect(container.__resolveByToken("ISimpleService")).not.toBeNullable();
  expect(container.__resolveByToken("ScalarService")).not.toBeNullable();
});
