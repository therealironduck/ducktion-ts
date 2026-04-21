import { expect } from "vitest";

import { LogLevelEnum } from "../../../src";
import { fakeLogger, test } from "../../base";
import {
  ServiceWithPrivateAndProtectedDecorator,
  ServiceWithPublicDecorator,
  ServiceWithResolveMethod,
} from "../../stubs/DecoratorServices";
import SimpleService, { SecondSimpleService } from "../../stubs/SimpleService";

test("it resolves any public field with a resolve decorator when resolving the main service", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);
  container.__registerAs("SecondSimpleService", SecondSimpleService);
  container.__registerAs("ServiceWithPublicDecorator", ServiceWithPublicDecorator);

  const service = container.__resolveByToken("ServiceWithPublicDecorator");
  expect(service).toBeInstanceOf(ServiceWithPublicDecorator);

  const servicePub = service as ServiceWithPublicDecorator;
  expect(servicePub.another).toBeInstanceOf(SecondSimpleService);
  expect(servicePub.simple).toBeInstanceOf(SimpleService);
});

test("it resolves private and protected fields aswell", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService);
  container.__registerAs("SecondSimpleService", SecondSimpleService);
  container.__registerAs("ServiceWithPrivateAndProtectedDecorator", ServiceWithPrivateAndProtectedDecorator);

  const service = container.__resolveByToken("ServiceWithPrivateAndProtectedDecorator");
  expect(service).toBeInstanceOf(ServiceWithPrivateAndProtectedDecorator);

  const servicePub = service as ServiceWithPrivateAndProtectedDecorator;
  expect(servicePub.gAnother).toBeInstanceOf(SecondSimpleService);
  expect(servicePub.gSimple).toBeInstanceOf(SimpleService);
});

test("it can resolve and call whole public methods that have the decorator", ({ container }) => {
  const logger = fakeLogger(container);

  container.__registerAs("SimpleService", SimpleService);
  container.__registerAs("SecondSimpleService", SecondSimpleService);
  container.__registerAs("ServiceWithResolveMethod", ServiceWithResolveMethod);

  const service = container.__resolveByToken("ServiceWithResolveMethod");
  expect(service).toBeInstanceOf(ServiceWithResolveMethod);

  const serviceRes = service as ServiceWithResolveMethod;
  expect(serviceRes.simple).toBeInstanceOf(SimpleService);
  expect(serviceRes.another).toBeInstanceOf(SecondSimpleService);

  logger.assertHasMessage(LogLevelEnum.debug, "I was called!");
});

/**
        
        [Test]
        public void ItCanResolveAndCallWholePrivateMethodsOfHaveThatAttribute()
        {
            var logger = FakeLogger();
            
            // Register registered services
            container.Register<SimpleService>();
            container.Register<AnotherService>();
            container.Register<ServiceWithPrivateResolveMethod>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithPrivateResolveMethod>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.NotNull(service.Simple);
            Assert.NotNull(service.Another);
            
            // Ensure that the method was called
            logger.AssertHasMessage(LogLevel.Debug, "I was called!");
        }
        
        // TEST IT can specify the ID for variables
        [Test]
        public void ItCanResolveSpecificIdsForFieldsAndProperties()
        {
            var simple1 = new SimpleService();
            var simple2 = new SimpleService();
            
            var another1 = new AnotherService();
            var another2 = new AnotherService();
            
            // Register registered services
            container.Register<SimpleService>(simple1);
            container.Register<SimpleService>(simple2, "simple");
            
            container.Register<AnotherService>(another1);
            container.Register<AnotherService>(another2, "another");
            
            container.Register<ServiceWithIdFieldsAndProperties>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithIdFieldsAndProperties>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.AreEqual(service.Simple, simple2);
            Assert.AreEqual(service.AnotherService, another2);
        }
        
        [Test]
        public void ItCanSpecifyIdsInConstructorArguments()
        {
            var simple1 = new SimpleService();
            var simple2 = new SimpleService();
            
            // Register registered services
            container.Register<SimpleService>(simple1);
            container.Register<SimpleService>(simple2, "simple");
            
            container.Register<AnotherService>();
            
            container.Register<ServiceWithIdConstructorArguments>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithIdConstructorArguments>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.AreEqual(service.Simple, simple2);
            Assert.NotNull(service.Another);
        }
        
        [Test]
        public void ItCanSpecifyIdsInMethodParameters()
        {
            var simple1 = new SimpleService();
            var simple2 = new SimpleService();
            
            // Register registered services
            container.Register<SimpleService>(simple1);
            container.Register<SimpleService>(simple2, "simple");
            
            container.Register<AnotherService>();
            
            container.Register<ServiceWithIdMethodParameters>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithIdMethodParameters>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.AreEqual(service.Simple, simple2);
            Assert.NotNull(service.Another);
        }
    }

	TODO: e2e tests
	*/
