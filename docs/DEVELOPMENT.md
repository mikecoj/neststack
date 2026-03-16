# Development Guide

This guide walks you through setting up a development environment for the NestX monorepo. It covers both local setup and the Docker-based dev container, explains how the tooling works, and shows how to run, test, and debug the code.

---

## Table of Contents

- [Option 1: Dev Container (Recommended)](#option-1-dev-container-recommended)
- [Option 2: Local Setup](#option-2-local-setup)
- [IDE Setup](#ide-setup)
- [Understanding NX](#understanding-nx)
- [Working with Packages](#working-with-packages)
- [Working with Applications](#working-with-applications)
- [Running Tests](#running-tests)
- [Building](#building)
- [Debugging](#debugging)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Option 1: Dev Container (Recommended)

Dev containers give you a fully configured development environment inside Docker. Everything -- Node.js, pnpm, PostgreSQL, Redis, VS Code extensions -- is set up automatically. This is the best option if you want to start coding immediately without installing tools on your machine.

### What you need

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (must be running)
- [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/)
- The [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Steps

1. **Open the repository** in VS Code or Cursor.

2. **Reopen in container.** VS Code will detect the `.devcontainer/` folder and show a notification. Click "Reopen in Container". Alternatively, use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "Dev Containers: Reopen in Container".

3. **Wait for the build.** The first time takes a few minutes. Docker will:
   - Build the dev container image (Node.js 22 + pnpm)
   - Start PostgreSQL and Redis
   - Run `pnpm install` to install all dependencies

4. **Start coding.** Open a terminal in VS Code (`Ctrl+`` `) and run:

```bash
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm nx serve demo  # Start the demo app
```

### What's running in the dev container

The dev container starts three Docker services defined in `.devcontainer/compose.yaml`:

| Service | Image                | Port | Purpose                      |
| ------- | -------------------- | ---- | ---------------------------- |
| `app`   | Custom (Node.js 22)  | --   | Your development environment |
| `db`    | `postgres:16-alpine` | 5432 | PostgreSQL database          |
| `redis` | `redis:7-alpine`     | 6379 | Redis cache                  |

All ports are forwarded to your host machine, so you can connect to PostgreSQL at `localhost:5432` and Redis at `localhost:6379` from database tools like pgAdmin or RedisInsight.

### Dev container security

The dev container follows banking/fintech security standards:

- **Non-root user**: You work as the `node` user, not `root`.
- **Dropped capabilities**: All Linux capabilities are dropped (`cap_drop: ALL`).
- **No privilege escalation**: The `no-new-privileges` flag prevents any process from gaining more privileges.
- **Read-only infrastructure**: PostgreSQL and Redis containers have read-only root filesystems. Only specific directories (data volumes, `/tmp`) are writable.
- **Resource limits**: Each service has memory and CPU limits to prevent runaway processes.
- **No Docker socket**: Docker CLI uses Docker-outside-of-Docker, not direct socket access.

### Default credentials

The dev environment uses these default credentials (defined in `.devcontainer/.env`):

| Variable            | Value              |
| ------------------- | ------------------ |
| `POSTGRES_USER`     | `nestx`            |
| `POSTGRES_PASSWORD` | `nestx_dev_secret` |
| `POSTGRES_DB`       | `nestx_demo`       |
| `REDIS_PASSWORD`    | `redis_dev_secret` |

These are for local development only. Never use these in production.

---

## Option 2: Local Setup

If you prefer not to use Docker, you can set up everything locally.

### 1. Install Node.js 22+

We recommend [Volta](https://volta.sh/) for managing Node.js versions:

```bash
# Install Volta (macOS/Linux)
curl https://get.volta.sh | bash

# Install Node.js 22
volta install node@22
```

Or download directly from [nodejs.org](https://nodejs.org/).

Verify your installation:

```bash
node --version   # Must be >= 22.0.0
```

### 2. Enable pnpm

pnpm is included with Node.js via Corepack. Just enable it:

```bash
corepack enable pnpm
pnpm --version   # Should show 10.x
```

### 3. Clone and install

```bash
git clone https://github.com/your-org/nestx-advanced-packages.git
cd nestx-advanced-packages
pnpm install
```

### 4. Verify everything works

```bash
pnpm build   # Should complete without errors
pnpm test    # All tests should pass (109 tests for advanced-config)
```

### 5. (Optional) Install PostgreSQL and Redis

If you want to run the demo app with real database/cache connections:

- **PostgreSQL**: [postgresql.org/download](https://www.postgresql.org/download/)
- **Redis**: [redis.io/download](https://redis.io/download/)

Or use Docker for just the infrastructure:

```bash
docker compose up db redis
```

---

## IDE Setup

### VS Code / Cursor

The dev container automatically installs these extensions:

- **ESLint** (`dbaeumer.vscode-eslint`) -- Highlights code quality issues
- **Prettier** (`esbenp.prettier-vscode`) -- Formats code on save
- **NX Console** (`nrwl.angular-console`) -- Visual UI for running NX tasks
- **Vitest Explorer** (`vitest.explorer`) -- Run tests from the editor sidebar

If you're not using the dev container, install these extensions manually from the VS Code marketplace.

**Recommended settings** (already configured in the dev container):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Using NX Console

NX Console is a visual way to run NX tasks. After installing the extension:

1. Open the NX Console panel from the sidebar (the NX icon)
2. You'll see a list of all projects (`advanced-config`, `demo`)
3. Click on a project to see its targets (`build`, `test`, `serve`)
4. Click a target to run it

This is often easier than remembering terminal commands.

---

## Understanding NX

### What NX does

NX manages the monorepo. Here's what you need to know:

1. **Projects** are defined by `project.json` files (or inferred from `package.json`). Each package and app is a project.

2. **Targets** are tasks a project can run: `build`, `test`, `serve`, `typecheck`. They're defined in `project.json` or inferred by NX plugins.

3. **The dependency graph** tracks which projects depend on others. Since `demo` imports `@nestx/advanced-config`, NX knows to build `advanced-config` before `demo`.

4. **Caching** saves build/test results. If nothing changed, NX replays the cached result instead of re-running the task. This makes repeated builds nearly instant.

### Key NX commands

```bash
# Run a target for a specific project
pnpm nx <target> <project>
pnpm nx build advanced-config
pnpm nx test advanced-config
pnpm nx serve demo

# Run a target for all projects
pnpm nx run-many -t build
pnpm nx run-many -t test

# Run a target only for projects affected by recent changes
pnpm nx affected -t test
pnpm nx affected -t build

# View the project dependency graph (opens in browser)
pnpm nx graph

# See details about a project
pnpm nx show project advanced-config
```

### How NX plugins work

This repo uses three NX plugins (configured in `nx.json`):

| Plugin               | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `@nx/js/typescript`  | Infers `build` and `typecheck` targets from `tsconfig.lib.json` |
| `@nx/vitest`         | Infers `test` targets from `vitest.config.ts`                   |
| `@nx/webpack/plugin` | Infers `build` and `serve` targets from `webpack.config.js`     |

Plugins auto-detect configuration files in each project and create targets automatically, so you don't need to manually define every target in `project.json`.

---

## Working with Packages

Packages live in the `packages/` directory. Each is a publishable NPM library.

### Package structure

```
packages/advanced-config/
  src/
    index.ts            Public API (barrel file -- re-exports everything users need)
    lib/
      *.ts              Implementation files
      *.spec.ts         Test files (colocated with source)
      interfaces/       TypeScript interfaces
      types/            Complex type definitions
      utils/            Utility functions
      loaders/          Env/secret/file loaders
  package.json          NPM package metadata
  project.json          NX project configuration
  tsconfig.json         Project-level TypeScript config
  tsconfig.lib.json     Build-specific TypeScript config (excludes tests)
  vitest.config.ts      Test runner configuration
  README.md             Package documentation
```

### Building a package

```bash
pnpm nx build advanced-config
```

Output goes to `dist/packages/advanced-config/`. The build uses `@nx/js:tsc` (TypeScript compiler) and produces both JavaScript and declaration (`.d.ts`) files.

### Testing a package

```bash
pnpm nx test advanced-config          # Run once
pnpm nx test advanced-config --watch  # Watch mode
pnpm nx test advanced-config --coverage  # With coverage report
```

Tests use [Vitest](https://vitest.dev/) and are configured in `vitest.config.ts`. The `@nestx/advanced-config` package requires 100% code coverage on all metrics (lines, branches, functions, statements).

### Adding a new package

```bash
# Generate a new NestJS library
pnpm nx g @nx/nest:library packages/my-new-package

# Or a plain TypeScript library
pnpm nx g @nx/js:library packages/my-new-package
```

Then update `tsconfig.base.json` to add a path alias:

```json
{
  "paths": {
    "@nestx/advanced-config": ["packages/advanced-config/src/index.ts"],
    "@nestx/my-new-package": ["packages/my-new-package/src/index.ts"]
  }
}
```

---

## Working with Applications

Applications live in the `apps/` directory. They are not published to NPM -- they're runnable programs.

### Serving an app

```bash
pnpm nx serve demo                          # Development mode (hot reload)
pnpm nx serve demo --configuration=production  # Production mode
```

The demo app uses Webpack for bundling (configured in `apps/demo/webpack.config.js`).

### Building an app

```bash
pnpm nx build demo
```

Output goes to `dist/apps/demo/`.

### Running with Docker

From the repository root:

```bash
docker compose up --build    # Build and start everything
docker compose up            # Start without rebuilding
docker compose down          # Stop everything
docker compose down -v       # Stop and delete data volumes
docker compose logs demo     # View demo app logs
docker compose logs -f demo  # Follow demo app logs in real time
```

---

## Running Tests

### Test framework: Vitest

This project uses [Vitest](https://vitest.dev/) for testing. Vitest is similar to Jest but faster and natively supports TypeScript and ES modules.

### Where tests live

Tests are colocated with the source code they test:

```
src/lib/config-store.ts       # Source file
src/lib/config-store.spec.ts  # Test file
```

### Running tests

```bash
# All tests in the workspace
pnpm test

# Tests for a specific package
pnpm nx test advanced-config

# Watch mode (re-runs when files change)
pnpm nx test advanced-config --watch

# With coverage report
pnpm nx test advanced-config --coverage

# Run a specific test file
pnpm nx test advanced-config -- --testPathPattern=config-store
```

### Writing tests

Tests use Vitest's `describe`, `it`, `expect` pattern. Here's a minimal example:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedConfigModule, ConfigService } from '@nestx/advanced-config';
import { Test } from '@nestjs/testing';
import { z } from 'zod';

describe('MyFeature', () => {
  beforeEach(() => {
    AdvancedConfigModule.reset();
  });

  it('should read config values', async () => {
    const module = await Test.createTestingModule({
      imports: [
        AdvancedConfigModule.forRoot({
          configs: [
            {
              namespace: 'test',
              schema: z.object({ value: z.string().default('hello') }),
              secretKeys: [],
            },
          ],
        }),
      ],
    }).compile();

    const config = module.get(ConfigService);
    expect(config.get('test.value' as any)).toBe('hello');
  });
});
```

Key testing patterns:

1. **Always call `AdvancedConfigModule.reset()`** in `beforeEach` to clear the static store.
2. **Use `envSource`** to inject fake environment variables instead of modifying `process.env`.
3. **Use `overrides`** to test specific config scenarios.

### Coverage thresholds

The `@nestx/advanced-config` package enforces 100% coverage. If you add code and tests don't cover it, the test run will fail. Check the coverage report to find uncovered lines:

```bash
pnpm nx test advanced-config --coverage
# Opens a report in coverage/packages/advanced-config/
```

---

## Building

### Build all projects

```bash
pnpm build
```

This is equivalent to `pnpm nx run-many -t build`. NX determines the correct build order from the dependency graph.

### Build a single project

```bash
pnpm nx build advanced-config
pnpm nx build demo
```

### Build output

| Project           | Output Directory                 | Contents                                |
| ----------------- | -------------------------------- | --------------------------------------- |
| `advanced-config` | `dist/packages/advanced-config/` | `.js` files + `.d.ts` type declarations |
| `demo`            | `dist/apps/demo/`                | Bundled application (single `main.js`)  |

### Clean build cache

If you're seeing stale results:

```bash
pnpm nx reset   # Clear NX cache
rm -rf dist     # Remove build output
pnpm build      # Rebuild from scratch
```

---

## Debugging

### Debugging in VS Code

The NX Nest generator creates a `.vscode/launch.json` with debug configurations. To debug the demo app:

1. Open the Run and Debug panel (`Ctrl+Shift+D`)
2. Select the debug configuration
3. Press F5 to start debugging

You can set breakpoints by clicking the gutter (left of line numbers) in any `.ts` file.

### Debugging tests

To debug a specific test in VS Code:

1. Open the test file
2. Click the "Debug" icon that appears above `describe` or `it` blocks (requires the Vitest Explorer extension)

Or from the terminal:

```bash
node --inspect-brk ./node_modules/.bin/vitest run --testPathPattern=config-store
```

Then attach VS Code's debugger (the "Attach to Node.js" configuration).

### Logging

The demo app prints its full configuration (with secrets masked) at startup. Look for the `[ConfigStore] Configuration:` log line.

For more verbose NX output:

```bash
NX_VERBOSE_LOGGING=true pnpm nx build advanced-config
```

---

## Environment Variables

### For the demo app

| Variable           | Default            | Description          |
| ------------------ | ------------------ | -------------------- |
| `DB_HOST`          | `db`               | PostgreSQL host      |
| `DB_PORT`          | `5432`             | PostgreSQL port      |
| `DB_NAME`          | `nestx_demo`       | Database name        |
| `DB_USER`          | `nestx`            | Database user        |
| `DB_PASSWORD`      | `nestx_dev_secret` | Database password    |
| `DB_SSL`           | `false`            | Enable SSL           |
| `DB_POOL_SIZE`     | `10`               | Connection pool size |
| `REDIS_HOST`       | `redis`            | Redis host           |
| `REDIS_PORT`       | `6379`             | Redis port           |
| `REDIS_PASSWORD`   | `redis_dev_secret` | Redis password       |
| `REDIS_DB`         | `0`                | Redis database index |
| `REDIS_KEY_PREFIX` | --                 | Optional key prefix  |

### For Docker Compose

Default values are set in `.devcontainer/.env`. To override them without modifying the file, create a `.env.local` file (which is git-ignored):

```bash
# .env.local
POSTGRES_PASSWORD=my_custom_password
REDIS_PASSWORD=my_custom_redis_pw
```

---

## Troubleshooting

### Problem: `pnpm install` hangs or fails on Windows

**Cause**: Antivirus software may be scanning/locking files in the pnpm store.

**Fix**: Relocate the pnpm store:

```powershell
pnpm config set store-dir "$env:LOCALAPPDATA\pnpm\store"
pnpm install
```

### Problem: `Cannot find module '@nestx/advanced-config'`

**Cause**: The package hasn't been built yet.

**Fix**: Build first:

```bash
pnpm nx build advanced-config
```

Or make sure `tsconfig.base.json` has the correct path alias:

```json
{
  "paths": {
    "@nestx/advanced-config": ["packages/advanced-config/src/index.ts"]
  }
}
```

### Problem: "Configuration namespace X is already registered"

**Cause**: `AdvancedConfigModule.reset()` wasn't called between tests.

**Fix**: Add it to `beforeEach`:

```typescript
beforeEach(() => {
  AdvancedConfigModule.reset();
});
```

### Problem: Docker Compose services won't start

**Fix**: Remove old containers and volumes, then rebuild:

```bash
docker compose down -v
docker compose up --build
```

### Problem: NX cache is stale

**Fix**: Clear the cache:

```bash
pnpm nx reset
```
