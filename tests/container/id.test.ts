import { test } from "../base";
// import SimpleService from "../stubs/SimpleService";

test("it can register the same service with different ids", () => {
  // container.__registerAs("ISimpleService", SimpleService, )
});

/**
        [Test]
        public void ItCanRegisterTheSameServiceWithDifferentIds()
        {
            container.Register<ISimpleInterface, SimpleService>("service1");
            container.Register<ISimpleInterface, SecondSimpleService>("service2");

            Assert.That(container.Resolve<ISimpleInterface>("service1"), Is.InstanceOf<SimpleService>());
            Assert.That(container.Resolve<ISimpleInterface>("service2"), Is.InstanceOf<SecondSimpleService>());
        }

        [Test]
        public void ItThrowsAnErrorIfAServiceWithTheSameIdIsRegisteredTwice()
        {
            container.Register<ISimpleInterface, SimpleService>("service1");

            var error = Assert.Throws<DependencyRegisterException>(() =>
            {
                container.Register<ISimpleInterface, SecondSimpleService>("service1");
            });

            Assert.That(error.Message, Does.Contain("Service is already registered"));
        }

        [Test]
        public void ItWorksWithEveryRegisterMethodSyntax()
        {
            container.Register(typeof(ISimpleInterface), typeof(SimpleService), "id1");
            Assert.That(container.Resolve<ISimpleInterface>("id1"), Is.InstanceOf<SimpleService>());

            container.Register(typeof(SimpleService), "id2");
            Assert.That(container.Resolve<SimpleService>("id2"), Is.InstanceOf<SimpleService>());

            container.Register<SimpleService>("id3");
            Assert.That(container.Resolve<SimpleService>("id3"), Is.InstanceOf<SimpleService>());

            container.Register<ISimpleInterface, SimpleService>("id4");
            Assert.That(container.Resolve<ISimpleInterface>("id4"), Is.InstanceOf<SimpleService>());

            container.Register(typeof(ISimpleInterface), new SimpleService(), "id5");
            Assert.That(container.Resolve<ISimpleInterface>("id5"), Is.InstanceOf<SimpleService>());

            container.Register<ISimpleInterface>(new SimpleService(), "id6");
            Assert.That(container.Resolve<ISimpleInterface>("id6"), Is.InstanceOf<SimpleService>());

            container.Register(typeof(ISimpleInterface), new Func<ISimpleInterface>(() => new SimpleService()), "id7");
            Assert.That(container.Resolve<ISimpleInterface>("id7"), Is.InstanceOf<SimpleService>());

            container.Register<ISimpleInterface>(new Func<ISimpleInterface>(() => new SimpleService()), "id8");
            Assert.That(container.Resolve<ISimpleInterface>("id8"), Is.InstanceOf<SimpleService>());
        }

        [Test]
        public void ItCanOverrideServicesWithIds()
        {
            container.Register<ISimpleInterface, SimpleService>(id: "service123");

            container.Override(typeof(ISimpleInterface), typeof(SecondSimpleService), id: "service123");

            Assert.That(container.Resolve<ISimpleInterface>("service123"), Is.InstanceOf<SecondSimpleService>());
        }

        [Test]
        public void ItWorksWithEveryOverrideMethodSyntax()
        {
            container.Register<ISimpleInterface, SimpleService>(id: "id1");
            container.Override(typeof(ISimpleInterface), typeof(SecondSimpleService), id: "id1");
            Assert.That(container.Resolve<ISimpleInterface>("id1"), Is.InstanceOf<SecondSimpleService>());

            container.Register<ISimpleInterface, SimpleService>(id: "id2");
            container.Override<ISimpleInterface, SecondSimpleService>(id: "id2");
            Assert.That(container.Resolve<ISimpleInterface>("id2"), Is.InstanceOf<SecondSimpleService>());

            container.Register<ISimpleInterface, SimpleService>(id: "id3");
            container.Override(typeof(ISimpleInterface), new SecondSimpleService(), id: "id3");
            Assert.That(container.Resolve<ISimpleInterface>("id3"), Is.InstanceOf<SecondSimpleService>());

            container.Register<ISimpleInterface, SimpleService>(id: "id4");
            container.Override<ISimpleInterface>(new SecondSimpleService(), id: "id4");
            Assert.That(container.Resolve<ISimpleInterface>("id4"), Is.InstanceOf<SecondSimpleService>());

            container.Register<ISimpleInterface, SimpleService>(id: "id5");
            container.Override(typeof(ISimpleInterface), () => new SecondSimpleService(), id: "id5");
            Assert.That(container.Resolve<ISimpleInterface>("id5"), Is.InstanceOf<SecondSimpleService>());
            
            container.Register<ISimpleInterface, SimpleService>(id: "id6");
            container.Override<ISimpleInterface>(() => new SecondSimpleService(), id: "id6");
            Assert.That(container.Resolve<ISimpleInterface>("id6"), Is.InstanceOf<SecondSimpleService>());
        }

		// TODO: E2E test
	*/
