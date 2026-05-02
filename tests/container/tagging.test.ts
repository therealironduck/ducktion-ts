import { expect } from "vitest";

import { countGenerator, test } from "../base";
import { ServiceWithLogger } from "../stubs/ServiceWithLogger";
import SimpleService, { SecondSimpleService } from "../stubs/SimpleService";

test("it can tag services", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example");
  container.__registerAs("SecondSimpleService", SecondSimpleService).withTag("example");
  container.__registerAs("ServiceWithLogger", ServiceWithLogger).withTag("another_tag");

  const tagged = container.getTagged<SimpleService>("example");

  const service1 = tagged.next();
  expect(service1.done).toBeFalsy();
  expect(service1.value).toBeInstanceOf(SimpleService);

  const service2 = tagged.next();
  expect(service2.done).toBeFalsy();
  expect(service2.value).toBeInstanceOf(SecondSimpleService);

  const service3 = tagged.next();
  expect(service3.done).toBeTruthy();
});

test("it can have multiple tags", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example").addTag("another_tag");
  container.__registerAs("SecondSimpleService", SecondSimpleService).withTags("example", "third_tag");
  container.__registerAs("ServiceWithLogger", ServiceWithLogger).addTag("another_tag");

  const taggedExample = container.getTagged("example");
  expect(countGenerator(taggedExample)).toBe(2);

  const taggedAnother = container.getTagged("another_tag");
  expect(countGenerator(taggedAnother)).toBe(2);

  const taggedThird = container.getTagged("third_tag");
  expect(countGenerator(taggedThird)).toBe(1);
});

test("it can remove specific tags", ({ container }) => {
  container.__registerAs("SimpleService", SimpleService).withTag("example").addTag("another_tag");
  container.__override("SimpleService").removeTag("another_tag");

  const taggedExample = container.getTagged("example");
  expect(countGenerator(taggedExample)).toBe(1);

  const taggedAnother = container.getTagged("another_tag");
  expect(countGenerator(taggedAnother)).toBe(0);
});
