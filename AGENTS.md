# AGENTS.md

This file provides guidance to pi and other coding agents when working with code in this repository.

## Project Overview

`@therealironduck/ducktion-ts` is a TypeScript dependency injection container library (early development). It is a TypeScript port of [Ducktion](https://github.com/therealironduck/Ducktion) (a C# Unity DI library). The planned feature set includes singleton/transient services, lazy resolution, auto dependency resolution, callbacks, attribute-based injection (`[Resolve]`), and service tagging.

## Commands

```bash
bun install          # Install dependencies
bun run build        # Bundle with tsdown → dist/
bun run dev          # Watch mode build
bun run test         # Run all tests with vitest
bun run test -- --reporter=verbose  # Run tests with verbose output
bun run typecheck    # Type-check without emitting
bun run lint         # Lint with oxlint
bun run lint:fix     # Auto-fix lint issues
bun run fmt          # Format with oxfmt
bun run fmt:check    # Check formatting
```

To run a single test file: `bun run test tests/index.test.ts`
To run a single test by name: `bun run test -- -t "test name"`

## Architecture

- `src/index.ts` — public entry point; everything exported here becomes part of the public API
- `tests/` — vitest tests, mirroring `src/` structure
- `tsdown.config.ts` — bundle config; outputs ESM to `dist/`, generates `.d.ts` via `tsgo: true`

TypeScript is strict (`strict: true`, `noUnusedLocals: true`, `verbatimModuleSyntax: true`). Use `import type` for type-only imports. The `tsconfig.json` only includes `src/` — test files are type-checked by vitest separately.

The published package exposes only `dist/index.mjs` (ESM). No CJS output.
