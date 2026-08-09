# Configure the container

Ducktion provides a good default configuration. However, you can customize it to your needs. Every configuration can be set using the `configure` method on the container.

```typescript
import DiContainer, { LogLevel } from "@therealironduck/ducktion-ts";

DiContainer.singleton.configure({
  newLevel: LogLevel.error,
  newEnableAutoResolve: false,
  newAutoResolveSingletonMode: "non-singleton",
  newDefaultLazyMode: "non-lazy",
  newDefaultSingletonMode: "non-singleton",
});
```

All options get merged with the default configuration, so you can omit parameters you don't want to change.

## Default values

| Parameter                   | Default value    |
| --------------------------- | ---------------- |
| newLevel                    | `LogLevel.error` |
| newEnableAutoResolve        | `true`           |
| newAutoResolveSingletonMode | "singleton"      |
| newDefaultLazyMode          | "lazy"           |
| newDefaultSingletonMode     | "singleton"      |

The `configure` method is optional if you want to use all the default values.
