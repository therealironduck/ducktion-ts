import { expect } from "vitest";

import { test } from "../../base";
import { ServiceWithPublicDecorator } from "../../stubs/DecoratorServices";
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

/**
        
        [Test]
        public void ItResolvesPrivateAndProtectedFieldsAsWell()
        {
            // Register registered services
            container.Register<SimpleService>();
            container.Register<AnotherService>();
            container.Register<ServiceWithPrivateAndProtectedAttribute>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithPrivateAndProtectedAttribute>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.NotNull(service.Simple);
            Assert.NotNull(service.AnotherService);
        }
        
        [Test]
        public void ItResolvesProperties()
        {
            // Register registered services
            container.Register<SimpleService>();
            container.Register<ServiceWithProperty>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithProperty>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.NotNull(service.Simple);
        }
        
        [Test]
        public void ItCanResolveAndCallWholePublicMethodsOfHaveThatAttribute()
        {
            var logger = FakeLogger();
            
            // Register registered services
            container.Register<SimpleService>();
            container.Register<AnotherService>();
            container.Register<ServiceWithResolveMethod>();
            
            // Resolve the main service
            var service = container.Resolve<ServiceWithResolveMethod>();
            
            // Ensure that both the resolve attribute and the constructor parameter are resolved
            Assert.NotNull(service.Simple);
            Assert.NotNull(service.Another);
            
            // Ensure that the method was called
            logger.AssertHasMessage(LogLevel.Debug, "I was called!");
        }
        
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
