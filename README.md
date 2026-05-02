# Ducktion TS

A simple, flexible dependency injection solution for Typescript!

## Features

- Dependency Injection container which can be used to register and resolve services
- Services can be registered with IDs
- Lazy and non-lazy services
- Singleton and transient services
- Auto Resolving of dependencies
- Dynamic instantiation of services with callbacks
- Resolving of dependencies using the `@resolve` and `@id` decorators

## Roadmap

- Rollup & Webpack, etc.
- Performance optimization (auto resolve -> skip node_modules, configurable)

## Installation

This package can be installed via your package manager of choice:

```shell
# NPM
npm install @therealironduck/ducktion-ts

# Bun
bun add @therealironduck/ducktion-ts

# PNPM
pnpm add @therealironduck/ducktion-ts
```

## Usage / Example

Please have a look at the documentation down below for full examples. This is just a little quick start

```ts
public class MyAwesomeService
{
    /// <summary>
    /// This class requires another class as a dependency!
    /// </summary>
    public MyAwesomeService(AnotherService another)
    {

    }

    public class AnotherService {}

    public class SomeWhereInMyGame()
    {
        public void Start()
        {
            /*
             * This will automatically create a singleton instance of
             * "MyAwesomeService" with all dependencies resolved!
             *
             * You can modify the behaviour further using Configurators
             * or the configuration in the container itself.
             *
             * @see https://ducktion.docs.jkniest.de
             */
            var awesomeService = Ducktion.singleton.Resolve<MyAwesomeService>();
        }
    }
}
```

## Documentation

[Documentation](https://therealironduck.github.io/ducktion-ts)

## Unity

There is also a Unity (C#) version of the dependency container: [Ducktion](https://github.com/therealironduck/Ducktion)

## Contributing

Contributions are always welcome!

See [CONTRIBUTING.md](https://github.com/therealironduck/ducktion-ts/blob/main/CONTRIBUTING.md) for ways to get started.

### Development

- Install dependencies. We recommend Bun for local development

```bash
bun install
```

- Run the unit tests:

```bash
bun run test
```

- Build the library:

```bash
bun run build
```

## Security

If you discover any security related issues, please email [mail@jkniest.de](mailto:mail@jkniest.de) instead of using the issue tracker.

## License

[MIT](https://choosealicense.com/licenses/mit/)
