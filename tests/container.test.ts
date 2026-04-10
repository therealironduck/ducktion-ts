import { expect, test } from "vitest";

import { DiContainer } from "../src";

test("it can instantiate a new container at runtime", () => {
  const singleton = DiContainer.singleton;

  expect(singleton).not.toBeNull();
  expect(singleton).toBeInstanceOf(DiContainer);
});

/**
	*        [Test]
        public void ItReturnsTheSameContainerEverytime()
        {
            var container1 = Ducktion.singleton;
            container1.Reinitialize();
            container1.Register<SimpleService>();

            var container2 = Ducktion.singleton;
            var service = container2.Resolve<SimpleService>();

            Assert.IsNotNull(service);
        }
		*/

test("it returns the same container everytime", () => {
  expect(true).toBeTruthy();
  // let container1 = DiContainer.singleton;
  // TODO: continue after `register` is implemented
});
