# Getting Started

:::info
Ducktion is also available for Unity! [Explore the Ducktion Unity Package](https://ducktion.docs.jkniest.de/)
:::

---

Ducktion TS is a package for TypeScript that provides a simple way to handle dependency injection in your project!

If you are new to dependency injection, you can read more about it [here](https://en.wikipedia.org/wiki/Dependency_injection). If you are a visual learner, you can watch [this video](https://www.youtube.com/watch?v=IKD2-MAkXyQ).

## Installation

Ducktion TS can be installed using any common package manager.

Start by installing the package:

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

Next, add the plugin to your bundler of choice. For more information on why a dedicated plugin is required, see [Internal mechanisms](/internal/mechanisms).

::: code-group

```ts{2,6} [vite.config.ts]
import { defineConfig } from 'vite'
import Ducktion from '@therealironduck/ducktion-ts/vite'

export default defineConfig({
  plugins: [
    Ducktion(),
  ],
})
```

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

```js{1,5} [webpack.config.js]
const Ducktion = require('@therealironduck/ducktion-ts/webpack')

module.exports = {
  plugins: [
    Ducktion(),
  ],
}
```

```js{2,9} [esbuild]
import * as esbuild from 'esbuild'
import Ducktion from '@therealironduck/ducktion-ts/esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist',
  plugins: [
    Ducktion(),
  ],
})
```

:::

For more information regarding your specific bundler, please refer to their dedicated documentation pages:

- [Vite](/use/vite)
- [Rolldown](/use/rolldown)
- [Webpack](/use/webpack)
- [EsBuild](/use/esbuild)

## Usage

Ducktion TS is designed to be as simple as possible to use. You can access the container from anywhere using `DiContainer.singleton`. If it doesn't exist, it will be created for you!

### Accessing services

Let's start by registering a service. A service is a class that you want to be able to access from anywhere using dependency injection. For example, let's say we have a class called `Player` that we want to access from anywhere in our project.

By default, Ducktion TS uses 'Auto Resolving', meaning you don't have to manually register your services. Let's see how you can access the `Player` class from anywhere in your project:

```ts
import DiContainer from "@therealironduck/ducktion-ts";

const player = DiContainer.singleton.resolve<Player>();
```

It will automatically create an instance of the `Player` class for you and return it. In addition, it will ensure that only one instance of the `Player` class is created. If you call `resolve<Player>()` again, it will return the same instance as before. Of course, you can change this behavior if you want to. See [the documentation](/services/singleton) for more information.

## What now?

Ducktion TS offers a lot of different features and ways to manage your services. For instance, you can register your services manually to have more fine-tuned control over how they are created. See [the documentation](/basics/configurators) for more details.
