import { expect } from "vitest";

import { test } from "../../base";
import { ServiceWithLogger } from "../../stubs/ServiceWithLogger";
import SimpleService, { SecondSimpleService } from "../../stubs/SimpleService";
import {
  ServiceWithPublicTagged,
  ServiceWithTagConstructorArguments,
  ServiceWithTagMethodParameters,
} from "../../stubs/TaggedServices";

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

test("it can specify tags in constructor arguments", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example");
  container.__registerAs("SecondSimpleService", SecondSimpleService).withTag("example");

  container.__registerAs("ServiceWithTagConstructorArguments", ServiceWithTagConstructorArguments);

  const service = container.__resolveByToken("ServiceWithTagConstructorArguments");
  expect(service).toBeInstanceOf(ServiceWithTagConstructorArguments);

  const serviceTag = service as ServiceWithTagConstructorArguments;
  expect(serviceTag.simple).not.toBeNullable();
  expect(serviceTag.simple.length).toBe(2);
});

test("it can specify tags in method parameters", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example");
  container.__registerAs("SecondSimpleService", SecondSimpleService).withTag("example");

  container.__registerAs("ServiceWithTagMethodParameters", ServiceWithTagMethodParameters);

  const service = container.__resolveByToken("ServiceWithTagMethodParameters");
  expect(service).toBeInstanceOf(ServiceWithTagMethodParameters);

  const serviceTag = service as ServiceWithTagMethodParameters;
  expect(serviceTag.services).not.toBeNullable();
  expect(serviceTag.services.length).toBe(2);
});

/**
TODO:

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
