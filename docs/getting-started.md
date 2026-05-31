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

```ts{2,6} [rolldown.config.ts]
import { defineConfig } from 'rolldown'
import Ducktion from '@therealironduck/ducktion-ts/rolldown'

export default defineConfig({
  plugins: [
    Ducktion(),
  ],
})
```

```js{1,10} [rollup.config.js]
import Ducktion from '@therealironduck/ducktion-ts/rollup'

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    Ducktion(),
  ],
}
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

For more information regarding your specific build-system please refer to their dedicated documentation pages:

- [Vite](/use/vite)
- [Rolldown](/use/rolldown)
- [Rollup](/use/rollup)
- [Webpack](/use/webpack)
- [EsBuild](/use/esbuild)
