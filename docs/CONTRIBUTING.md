# Contributing

Thank you for contributing to NestX Advanced Packages. This guide covers everything you need to know to submit quality contributions.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Conventions](#commit-conventions)
- [Writing Tests](#writing-tests)
- [Pull Request Process](#pull-request-process)
- [Adding a New Package](#adding-a-new-package)
- [Documentation](#documentation)

---

## Getting Started

1. Fork the repository (or create a branch if you have write access)
2. Set up your development environment following the [Development Guide](DEVELOPMENT.md)
3. Create a feature branch from `main`:

```bash
git checkout -b feat-my-feature
```

---

## Development Workflow

### Typical flow

```
1. Create a branch from main
2. Make your changes
3. Write/update tests
4. Run tests locally (pnpm test)
5. Run the build (pnpm build)
6. Commit with conventional commits
7. Push and create a pull request
```

### Before committing

Always verify your changes pass these checks:

```bash
pnpm build        # Builds all projects without errors
pnpm test         # All tests pass
pnpm typecheck    # No type errors
npx prettier --check .  # Code is formatted
```

---

## Code Style

### TypeScript

- **Strict mode is enabled.** All strict TypeScript checks are active (`strict: true` in `tsconfig.base.json`). Do not use `@ts-ignore` or `any` unless absolutely necessary and documented with a comment explaining why.

- **No default exports.** Use named exports everywhere for better refactoring support and auto-imports.

- **Prefer `interface` for object shapes** and `type` for unions, intersections, and utility types.

- **Explicit return types on public methods.** Internal/private methods can use type inference.

### Formatting

This project uses [Prettier](https://prettier.io/) for formatting. Configuration is in `.prettierrc`:

| Setting         | Value              |
| --------------- | ------------------ |
| Single quotes   | `true`             |
| Trailing commas | `all` (everywhere) |
| Print width     | `100` characters   |
| Tab width       | `2` spaces         |
| Semicolons      | `true` (always)    |

Format your files before committing:

```bash
npx prettier --write .
```

If you use VS Code with the Prettier extension and `editor.formatOnSave` enabled (configured in the dev container), files are formatted automatically on save.

### File naming

| Item                    | Convention                       | Example                          |
| ----------------------- | -------------------------------- | -------------------------------- |
| Source files            | `kebab-case.ts`                  | `config-store.ts`                |
| Test files              | `kebab-case.spec.ts` (colocated) | `config-store.spec.ts`           |
| Interface files         | `kebab-case.interface.ts`        | `config-definition.interface.ts` |
| Module files            | `kebab-case.module.ts`           | `health.module.ts`               |
| Controller files        | `kebab-case.controller.ts`       | `showcase.controller.ts`         |
| Config definition files | `kebab-case.config.ts`           | `database.config.ts`             |
| Barrel files            | `index.ts`                       | `index.ts`                       |

### Import ordering

Organize imports in this order, separated by blank lines:

1. Node.js built-ins (`import { readFile } from 'fs'`)
2. External packages (`import { Injectable } from '@nestjs/common'`)
3. Internal packages (`import { ConfigService } from '@nestx/advanced-config'`)
4. Relative imports (`import { deepFreeze } from './utils'`)

### Comments

- Do not add comments that just restate what the code does.
- Add comments to explain _why_ something is done a certain way, not _what_ it does.
- Use JSDoc comments on public APIs (interfaces, exported functions, public methods).

```typescript
// Bad: obvious comment
// Create a new map
const map = new Map();

// Good: explains a non-obvious decision
// Using a static store because forRoot() and forFeature() are called
// at decoration time, before NestJS DI is available
private static readonly globalStore = new ConfigStore();
```

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with [Gitmoji](https://gitmoji.dev/).

### Format

```
<type>(scope): <gitmoji> <description>
```

### Types

| Type       | When to use                                         | Gitmoji            |
| ---------- | --------------------------------------------------- | ------------------ |
| `feat`     | New feature                                         | Depends on feature |
| `fix`      | Bug fix                                             | :bug:              |
| `docs`     | Documentation changes                               | :memo:             |
| `refactor` | Code change that doesn't fix a bug or add a feature | :recycle:          |
| `test`     | Adding or updating tests                            | :white_check_mark: |
| `chore`    | Build process, CI, tooling                          | :wrench:           |
| `perf`     | Performance improvement                             | :zap:              |
| `style`    | Formatting, whitespace (no code change)             | :art:              |

### Scope

The scope is the package or area affected:

- `advanced-config` -- Changes to the config package
- `demo` -- Changes to the demo app
- `devcontainer` -- Changes to dev container config
- `docs` -- Documentation changes
- `workspace` -- Root workspace changes (nx.json, tsconfig.base.json, etc.)

### Examples

```
feat(advanced-config): :sparkles: add forRootAsync support with useClass
fix(advanced-config): :bug: fix envSource not shared between forRoot and forFeature
docs(advanced-config): :memo: add real-world use cases to README
test(advanced-config): :white_check_mark: add coverage for useExisting branch
chore(workspace): :wrench: configure pnpm store directory for Windows
feat(demo): :sparkles: add showcase controller with all config endpoints
feat(devcontainer): :lock: add hardened compose.yaml with banking security standards
refactor(advanced-config): :recycle: extract normalizeConfig helper
```

---

## Writing Tests

### Framework

Tests use [Vitest](https://vitest.dev/). The configuration is in `vitest.config.ts` within each package.

### Test file location

Tests are colocated with source files:

```
src/lib/config-store.ts        # Source
src/lib/config-store.spec.ts   # Tests
```

### Structure

Use `describe` blocks to group related tests and `it` blocks for individual test cases:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ConfigStore', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  describe('register', () => {
    it('should register a config namespace', () => {
      // ...
    });

    it('should throw on duplicate namespace', () => {
      // ...
    });
  });
});
```

### Naming conventions

- `describe` blocks: Use the class or function name.
- `it` blocks: Start with "should" and describe the expected behavior.
- Be specific: "should throw on duplicate namespace" is better than "should handle errors".

### Testing NestJS modules

When testing the `AdvancedConfigModule`:

```typescript
import { Test } from '@nestjs/testing';
import { AdvancedConfigModule, ConfigService } from '@nestx/advanced-config';

beforeEach(() => {
  AdvancedConfigModule.reset(); // REQUIRED: clear static state
});

it('should provide ConfigService', async () => {
  const module = await Test.createTestingModule({
    imports: [
      AdvancedConfigModule.forRoot({
        configs: [myConfig],
        envSource: { MY_VAR: 'test-value' }, // Inject fake env vars
      }),
    ],
  }).compile();

  const config = module.get(ConfigService);
  expect(config).toBeDefined();
});
```

### Coverage requirements

`@nestx/advanced-config` requires **100% code coverage** on:

- Lines
- Branches
- Functions
- Statements

If you add code that isn't covered by tests, the CI will fail. Run coverage locally to check:

```bash
pnpm nx test advanced-config --coverage
```

The coverage report will tell you which lines are uncovered.

---

## Pull Request Process

### 1. Create your branch

```bash
git checkout -b feat-my-feature
```

### 2. Make your changes

Follow the code style and commit conventions above.

### 3. Verify locally

```bash
pnpm build
pnpm test
pnpm typecheck
```

### 4. Push and create the PR

```bash
git push -u origin feat-my-feature
```

Then create a pull request on GitHub.

### 5. PR description

Include:

- **What** the change does (1-3 sentences)
- **Why** it's needed
- **How to test** -- steps for reviewers to verify your change
- **Breaking changes** -- if any, describe the migration path

### 6. Review process

- At least one approval is required before merging
- All CI checks must pass (build, test, typecheck, format)
- Resolve all review comments before merging

---

## Adding a New Package

### 1. Generate the package

```bash
# NestJS library (with module, service scaffolding)
pnpm nx g @nx/nest:library packages/my-package --publishable --importPath=@nestx/my-package

# Plain TypeScript library
pnpm nx g @nx/js:library packages/my-package --publishable --importPath=@nestx/my-package
```

### 2. Update path aliases

Add the new package to `tsconfig.base.json`:

```json
{
  "paths": {
    "@nestx/advanced-config": ["packages/advanced-config/src/index.ts"],
    "@nestx/my-package": ["packages/my-package/src/index.ts"]
  }
}
```

### 3. Configure testing

Create a `vitest.config.ts` in the package root:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/index.ts', 'src/lib/types/**', 'src/lib/interfaces/**'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
```

### 4. Set up the barrel file

Create `src/index.ts` that exports the public API:

```typescript
export { MyService } from './lib/my-service';
export type { MyInterface } from './lib/interfaces';
```

Only export what consumers need. Internal implementation details should not be exported.

### 5. Write documentation

Create a `README.md` in the package root. Follow the same structure as the [`@nestx/advanced-config` README](../packages/advanced-config/README.md):

1. One-line description
2. Features table
3. Installation
4. Quick start
5. Detailed usage
6. API reference
7. Testing guide
8. Best practices

### 6. Add to root README

Update the root `README.md` packages table:

```markdown
| Package                                               | Version | Description |
| ----------------------------------------------------- | ------- | ----------- |
| [`@nestx/advanced-config`](packages/advanced-config/) | 0.0.1   | ...         |
| [`@nestx/my-package`](packages/my-package/)           | 0.0.1   | ...         |
```

---

## Documentation

### When to update docs

- **New feature**: Update the package README and root README
- **API change**: Update the API reference section in the package README
- **New package**: Add to root README, create package README
- **Infrastructure change**: Update DEVELOPMENT.md and/or ARCHITECTURE.md
- **Process change**: Update this file (CONTRIBUTING.md)

### Documentation files

| File                   | What it covers                       |
| ---------------------- | ------------------------------------ |
| `README.md` (root)     | Repository overview, getting started |
| `docs/DEVELOPMENT.md`  | Dev environment setup                |
| `docs/ARCHITECTURE.md` | Code structure and design decisions  |
| `docs/CONTRIBUTING.md` | This file -- how to contribute       |
| `packages/*/README.md` | Per-package documentation            |
| `apps/*/README.md`     | Per-app documentation                |

### Writing style

- Write for a junior engineer who's never seen this codebase before
- Explain _why_ before _how_
- Use concrete examples, not abstract descriptions
- Include expected output for command examples
- Keep sentences short and direct
