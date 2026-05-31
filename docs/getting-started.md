# Getting Started

Ducktion TS is a package for TypeScript that provides a simple way to handle dependency injection in your project!

If you are new to dependency injection, you can read more about it [here](https://en.wikipedia.org/wiki/Dependency_injection). If you are a visual learner, you can watch [this video](https://www.youtube.com/watch?v=IKD2-MAkXyQ).

## Installation

Ducktion TS can be installed using the any common package manager. 

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

Next add the plugin to your build-system of choice. For more information, why a dedicated plugin is required, see [Internal mechanisms](/internal-mechanisms).

We currently support:
- [Vite](/use/vite)
- [Rolldown](/use/rolldown)
- [Rollup](/use/rollup)
- [Webpack](/use/webpack)
- [EsBuild](/use/esbuild)

In this getting started guide we assume you are using Vite. If not, please look at the installation methods above for your build system.

::: code-group
```ts [vite.config.ts]
import { defineConfig } from 'vite'
import Ducktion from '@therealironduck/ducktion-ts/vite' // [!code focus]

export default defineConfig({
  plugins: [
    Ducktion(),// [!code focus]
  ],
})
```
:::
