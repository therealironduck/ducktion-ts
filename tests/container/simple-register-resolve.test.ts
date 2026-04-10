import { expect } from "vitest";

import { test } from "../base";
import SimpleService from "../stubs/SimpleService";

test.only("it can register a simple service and resolve it", ({ container }) => {
  // Note: You can use `container.Register<SimpleService>()` for better type saftey
  container.__registerImplementation(SimpleService);

  let service = container.__resolveByToken(SimpleService);
  expect(service).toBeInstanceOf(SimpleService);
});

// test("it can register a service for an interface and resolve it", ({ container }) => {
//   container.register(ISimpleInterface, SimpleService);
//
//   const service = container.resolve(ISimpleInterface);
//   expect(service).toBeInstanceOf(SimpleService);
// });

/**

        [Test]
        public void ItCanRegisterAServiceForAnInterfaceAndResolveIt()
        {
            container.Register<ISimpleInterface, SimpleService>();

            var service = container.Resolve<ISimpleInterface>();
            Assert.IsInstanceOf<SimpleService>(service);
        }
		*/
