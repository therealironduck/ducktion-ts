import { expect } from "vitest";

import { test } from "../../base";
import { ServiceWithLogger } from "../../stubs/ServiceWithLogger";
import SimpleService, { SecondSimpleService } from "../../stubs/SimpleService";
import { ServiceWithPublicTagged } from "../../stubs/TaggedServices";

test("it resolves any public fields with a resolve tags attribute when resolving the main service", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example");
  container.__registerAs("ServiceWithLogger", ServiceWithLogger).withTag("example");
  container.__registerAs("SecondSimpleService", SecondSimpleService).withTag("example");

  container.__registerAs("ServiceWithPublicTagged", ServiceWithPublicTagged);

  const service = container.__resolveByToken("ServiceWithPublicTagged");
  expect(service).toBeInstanceOf(ServiceWithPublicTagged);

  const serviceTagged = service as ServiceWithPublicTagged;
  expect(serviceTagged.services).not.toBeNullable();
  expect(serviceTagged.another).toBeInstanceOf(SecondSimpleService);

  expect(serviceTagged.services.length).toBe(3);
});

/**
TODO:
        [Test]
        public void ItResolvesAnyPublicFieldWithAResolveTagsAttributeWhenResolvingTheMainService()
        {
            container.Register<SimpleService>().WithTag("example");
            container.Register<ServiceWithLogger>().WithTag("example");
            container.Register<AnotherService>().WithTag("example");
            container.Register<ServiceWithPublicTagged>();

            var service = container.Resolve<ServiceWithPublicTagged>();

            Assert.NotNull(service.Services);
            Assert.NotNull(service.Another);

            Assert.AreEqual(3, service.Services.Count);
        }

        [Test]
        public void ItResolvesPrivateAndProtectedFieldsWithTagsAsWell()
        {
            container.Register<SimpleService>().WithTag("example");
            container.Register<AnotherService>().WithTag("example");
            container.Register<ServiceWithPrivateAndProtectedTagged>();

            var service = container.Resolve<ServiceWithPrivateAndProtectedTagged>();

            Assert.NotNull(service.Simple);
            Assert.AreEqual(2, service.Simple.Count);

            Assert.NotNull(service.AnotherService);
            Assert.AreEqual(2, service.AnotherService.Count);
        }

        [Test]
        public void ItResolvesTaggedProperties()
        {
            container.Register<SimpleService>().WithTag("example");
            container.Register<AnotherService>().WithTag("example");
            container.Register<ServiceWithPropertyTagged>();

            var service = container.Resolve<ServiceWithPropertyTagged>();

            Assert.NotNull(service.Simple);
            Assert.AreEqual(2, service.Simple.Count);
        }

        [Test]
        public void ItCanSpecifyTagsInConstructorArguments()
        {
            container.Register<SimpleService>().WithTag("example");
            container.Register<AnotherService>().WithTag("example");

            container.Register<ServiceWithTagConstructorArguments>();

            var service = container.Resolve<ServiceWithTagConstructorArguments>();

            Assert.NotNull(service.Simple);
            Assert.AreEqual(2, service.Simple.Count);
        }

        [Test]
        public void ItCanSpecifyTagsInMethodParameters()
        {
            container.Register<SimpleService>().WithTag("example");
            container.Register<AnotherService>().WithTag("example");

            container.Register<ServiceWithTagMethodParameters>();

            var service = container.Resolve<ServiceWithTagMethodParameters>();

            Assert.NotNull(service.Simple);
            Assert.AreEqual(2, service.Simple.Count);
        }

        // TODO: Make sure TaggedService can never be auto resolved !!
        // Maybe even a guard feature
	*/
