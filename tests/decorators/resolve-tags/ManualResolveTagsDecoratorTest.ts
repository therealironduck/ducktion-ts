import { test } from "../../base";

test("test", () => {});

/**
	TODO:

        [Test]
        public void ItCanResolveAnyTaggedServicesAfterObjectAlreadyExists()
        {
            container.Register<SimpleService>().WithTag("example");
            container.Register<AnotherService>().WithTag("example");
            
            var service = new ServiceWithResolveMethodAndResolveTags();
            container.ResolveDependencies(service);
            
            Assert.NotNull(service.Simple);
            Assert.AreEqual(2, service.Simple.Count);
        }
	*/
