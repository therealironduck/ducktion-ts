import { expect } from "vitest";

import { test } from "../base";
import ScalarService from "../stubs/ScalarService";

test("it can bind callbacks which get used to resolve", ({ container }) => {
  let called = false;
  const action = () => {
    called = true;
    return new ScalarService(123);
  };

  container.__registerAs("ScalarService", ScalarService, action);
  expect(called).toBeFalsy();

  const service = container.__resolveByToken("ScalarService");
  expect(called).toBeTruthy();
  expect(service).toBeInstanceOf(ScalarService);

  const scalar = service as ScalarService;
  expect(scalar.scalar).toEqual(123);
});

test("it can override callbacks without existing instances", ({ container }) => {
  const action = () => new ScalarService(123);
  container.__registerAs("ScalarService", ScalarService);

  container.__override("ScalarService", ScalarService, action);

  const service = container.__resolveByToken("ScalarService");
  const scalarService = service as ScalarService;

  expect(scalarService.scalar).toBe(123);
});

test("it can override callbacks with existing instance", ({ container }) => {
  const action = () => new ScalarService(123);
  const existing = new ScalarService(42);

  container.__registerAs("ScalarService", ScalarService).setInstance(existing);

  container.__override("ScalarService", ScalarService, action);

  const service = container.__resolveByToken("ScalarService");
  const scalarService = service as ScalarService;

  expect(scalarService.scalar).toBe(123);
});

/**
        [Test]
        public void ItCanRegisterCallbacksWithAbstractServicesOrInterfaces()
        {
            var simpleImplementation = new SimpleService();
            var action = new Func<ISimpleInterface>(() => simpleImplementation);

            container.Register<ISimpleInterface>(action);

            var service = container.Resolve<ISimpleInterface>();
            Assert.AreSame(simpleImplementation, service);
        }

        [Test]
        public void ItStoresTheCallbackResultsAsSingletonByDefault()
        {
            var calledCount = 0;
            var service = new ScalarService(123);

            var action = new Func<ScalarService>(() =>
            {
                calledCount++;
                return service;
            });

            container.Register<ScalarService>(action);

            var service1 = container.Resolve<ScalarService>();
            Assert.AreEqual(1, calledCount);
            Assert.AreEqual(123, service1.Value);

            service1.Value = 456;
            var service2 = container.Resolve<ScalarService>();
            Assert.AreEqual(1, calledCount);
            Assert.AreEqual(456, service2.Value);
        }
    }
	*/
