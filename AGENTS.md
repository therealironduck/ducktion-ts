# Repository Guidelines

## Project Structure & Module Organization

This is an ESM-only TypeScript dependency-injection library. Core container code lives in `src/core/`; public types are in `src/types/`; and build-tool transformations are in `src/plugin/`. The public entry points are `src/index.ts`, `src/vite.ts`, and `src/rolldown.ts`; their exports define the package API.

Tests live in `tests/` and are grouped by concern: `container/`, `decorators/`, `plugin/`, `unit/`, and `integration/`. Reusable fixtures belong in `tests/stubs/`. User documentation is maintained under `docs/` with VitePress.

## Build, Test, and Development Commands

- `bun install` installs the locked dependencies.
- `bun run build` bundles all entry points with tsdown and emits declarations to `dist/` with TypeScript.
- `bun run dev` rebuilds bundles in watch mode.
- `bun run typecheck` checks `src/` without emitting files.
- `bun run test:once` runs Vitest once; `bun run test` starts its interactive mode.
- `bun run test:once tests/container/lazy.test.ts` runs one file.
- `bun run lint` and `bun run fmt:check` reproduce the lint and formatting CI checks.
- `bun run docs:dev` serves the documentation locally.

## Coding Style & Naming Conventions

Use strict TypeScript and ESM imports. Prefer `import type` for type-only dependencies and avoid unused locals. Oxfmt enforces formatting, import ordering, and a 120-character print width; run `bun run fmt` after edits. Oxlint performs type-aware correctness checks. Follow existing naming: PascalCase for classes and exported types, camelCase for functions and variables, and descriptive kebab-case test filenames such as `auto-resolve.test.ts`.

## Testing Guidelines

Vitest is the test framework. Add or update tests for every behavior change; `CONTRIBUTING.md` treats tests as required. Place focused tests beside the matching concern and use `tests/integration/e2e/` when verifying transformed code through a build tool. No numeric coverage threshold is configured. Before submitting, run `bun run lint`, `bun run fmt:check`, `bun run build`, and `bun run test:once`.

## Commit & Pull Request Guidelines

Use Conventional Commit subjects consistent with history, for example `fix(container): allow type-only imports` or `chore(deps): update dependencies`. Keep each pull request focused on one feature or fix. Explain the motivation and behavior change, link relevant issues, add tests, and update `README.md` or `docs/` when public behavior changes. CI validates commits, linting, formatting, builds, and tests.

## Security & Compatibility

Do not report vulnerabilities publicly; follow the email disclosure guidance in `README.md`. Treat changes to exported entry points or runtime transformation behavior as compatibility-sensitive and avoid unplanned breaking API changes.
