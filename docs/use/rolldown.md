# Use with Rolldown

Before configuring anything in Rolldown, start by installing the package via your package manager of choice:

::: code-group

```sh [npm]
npm install @therealironduck/ducktion-ts
```

```sh [bun]
bun add @therealironduck/ducktion-ts
```

```sh [yarn]
yarn add @therealironduck/ducktion-ts
```

```sh [pnpm]
pnpm add @therealironduck/ducktion-ts
```

:::

Afterward, you'll need to configure our Rolldown Plugin. It will automatically handle everything needed for Ducktion TS. You can add the plugin to your `rolldown.config.ts` file:

```ts{2,5,7} [rolldown.config.ts]
import { defineConfig } from 'rolldown'
import Ducktion from '@therealironduck/ducktion-ts/rolldown'

export default defineConfig({
  platform: "node",
  plugins: [
    Ducktion(),
  ],
})
```

:::warning
Ducktion requires the `platform` to be set to `node`.
:::

That's it! Now you can [start using the container](/getting-started#usage) straight away!
