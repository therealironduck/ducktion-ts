# Use with Vite

Before configuring anything in Vite, start by installing the package via your package manager of choice:

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

Afterwards, you'll need to configure our Vite Plugin. It will automatically handle everything needed for Ducktion TS. You can add the plugin to your `vite.config.ts` file:

```ts{2,6} [vite.config.ts]
import { defineConfig } from 'vite'
import Ducktion from '@therealironduck/ducktion-ts/vite'

export default defineConfig({
  plugins: [
    Ducktion(),
  ],
})
```

That's it! Now you can [start using the container](/getting-started#usage) straight away!
