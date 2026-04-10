import { test as baseTest } from "vitest";

import DiContainer from "../src";

export type DucktionTestConfig = {
  createContainer: boolean;
};

/* oxlint-disable eslint-plugin-jest(expect-expect) */
export const test = baseTest.extend("container", async (): Promise<DiContainer> => {
  const container = new DiContainer();
  // TODO: container.configure();

  return container;
});
