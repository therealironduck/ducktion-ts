import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it can clear a container", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);

  const service = container.__resolveByToken("SimpleService");
  expect(service).not.toBeNullable();

  container.clear();

  expect(() => container.__resolveByToken("SimpleService")).toThrow();
});

// TODO: Implement when singleton mode is implemented
/**
       [Test]
        public void ItClearsAllSingletonInstances()
        {
            container.Register<SimpleService>();
            var serviceA = container.Resolve<SimpleService>();

            container.Clear();
            
            container.Register<SimpleService>();
            var serviceB = container.Resolve<SimpleService>();
            
            Assert.AreNotEqual(serviceA, serviceB);
        }

        [Test]
        public void ITCanOnlyResetTheSingletons()
        {
            container.Register<SimpleService>();
            var serviceA = container.Resolve<SimpleService>();

            container.Reset();
            
            var serviceB = container.Resolve<SimpleService>();
            
            Assert.AreNotEqual(serviceA, serviceB);
        }
        */
