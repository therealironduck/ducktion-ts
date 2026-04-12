import { expect } from "vitest";

import { testWithAutoResolve as test } from "../base";
import SimpleService from "../stubs/SimpleService";

test("it can automatically resolve unknown services", ({ container }) => {
  const result = container.__resolveWithType("SimpleService", SimpleService);

  expect(result).not.toBeNull();
  expect(result).toBeInstanceOf(SimpleService);
});

/**
        [Test]
        public void ItCanAutomaticallyResolveUnknownServicesRecursively()
        {
            var result = container.Resolve<SimpleServiceWithDependency>();
            Assert.NotNull(result);
            Assert.IsInstanceOf<SimpleServiceWithDependency>(result);
            
            Assert.IsInstanceOf<AnotherService>(result.Another);
        }
        
        [Test]
        public void ItCanMixAutomaticResolvesWithManuallyRegisteredInterfaces()
        {
            container.Register<ISimpleInterface, SimpleServiceWithDependency>();
            
            var result = container.Resolve<ServiceWithDependencies>();
            Assert.NotNull(result);
            Assert.IsInstanceOf<ServiceWithDependencies>(result);
            
            Assert.IsInstanceOf<SimpleServiceWithDependency>(result.Simple);
            
            Assert.IsInstanceOf<AnotherService>((result.Simple as SimpleServiceWithDependency)?.Another);
        }
        
        [Test]
        public void ItStoresThemAsSingletons()
        {
            var result1 = container.Resolve<SimpleService>();
            var result2 = container.Resolve<SimpleService>();
            
            Assert.AreSame(result1, result2);
        }
        
        [Test]
        public void ItCanOptionallyNotStoreThemAsSingletons()
        {
            container.Configure(newAutoResolveSingletonMode: SingletonMode.NonSingleton);
            
            var result1 = container.Resolve<SimpleService>();
            var result2 = container.Resolve<SimpleService>();
            
            Assert.AreNotSame(result1, result2);
        }
	*/
