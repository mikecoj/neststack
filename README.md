# NestX Advanced Packages

> **[View the full documentation](https://mikecoj.github.io/nestx-advanced-packages/)**

An NX monorepo containing enterprise-grade NestJS packages designed for banking, fintech, and mission-critical applications. Every package is built with strict type safety, comprehensive testing, and security-first design.

## What Is This Repository?

This is a **monorepo** -- a single Git repository that contains multiple related projects. It uses [NX](https://nx.dev) to manage builds, tests, and dependencies across all projects. Think of it like a toolbox: each package in the `packages/` folder is a tool you can install separately in your NestJS applications.

The `apps/` folder contains applications that demonstrate how to use the packages.

## Packages

| Package                                               | Version | Description                                                                                                              |
| ----------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`@nestx/advanced-config`](packages/advanced-config/) | 0.0.1   | Enterprise-grade, type-safe configuration module with Zod validation, secret masking, O(1) lookups, and full diagnostics |

## Applications

| App                  | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| [`demo`](apps/demo/) | NestJS app showcasing every feature of `@nestx/advanced-config` through HTTP endpoints |

---

## Prerequisites

Before you begin, make sure you have these tools installed on your machine:

| Tool                  | Minimum Version | How to Check       | Install Guide                                    |
| --------------------- | --------------- | ------------------ | ------------------------------------------------ |
| **Node.js**           | 22.0.0          | `node --version`   | [nodejs.org](https://nodejs.org)                 |
| **pnpm**              | 10.x            | `pnpm --version`   | `corepack enable pnpm` (built into Node.js)      |
| **Git**               | 2.x             | `git --version`    | [git-scm.com](https://git-scm.com)               |
| **Docker** (optional) | 24.x            | `docker --version` | [docker.com](https://www.docker.com/get-started) |

**What are these tools?**

- **Node.js** is the JavaScript runtime that runs your code outside a browser.
- **pnpm** is a fast package manager (like npm or yarn) that installs your project's dependencies.
- **NX** is a build system that understands the relationships between packages. It's installed as a project dependency -- you don't need to install it globally.
- **Docker** lets you run the demo application with its database and cache services in containers.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/nestx-advanced-packages.git
cd nestx-advanced-packages
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all dependencies for every package and application in the monorepo. pnpm uses a single shared store, so it's fast and disk-efficient.

### 3. Build everything

```bash
pnpm build
```

This builds all packages in the correct order. NX automatically figures out which packages depend on which and builds them in the right sequence.

### 4. Run all tests

```bash
pnpm test
```

This runs the test suites for all packages. The `@nestx/advanced-config` package targets 100% code coverage.

### 5. Type check

```bash
pnpm typecheck
```

This verifies TypeScript types are correct across all projects without producing build output.

---

## Running the Demo Application

The demo app showcases every feature of `@nestx/advanced-config`. You have three ways to run it:

### Option A: Docker Compose (recommended for first-time users)

This is the easiest way -- it starts the app, PostgreSQL, and Redis all together:

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`. Try these endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/showcase/safe
curl http://localhost:3000/showcase/namespace/app
curl http://localhost:3000/showcase/explain/database.password
```

To stop everything: press `Ctrl+C` or run `docker compose down`.

### Option B: Dev Container (recommended for development)

If you use VS Code or Cursor:

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open this repository in VS Code/Cursor
3. Click "Reopen in Container" when prompted (or use the command palette: `Dev Containers: Reopen in Container`)
4. Once the container is ready:

```bash
pnpm nx serve demo
```

The dev container comes pre-configured with PostgreSQL, Redis, and all the right VS Code extensions.

### Option C: Local development (no Docker)

If you prefer running everything locally:

```bash
# Set required environment variables
export DB_HOST=localhost
export DB_PASSWORD=your_password
export REDIS_PASSWORD=your_password

# Serve the demo with hot reload
pnpm nx serve demo
```

You'll need PostgreSQL and Redis running locally, or the app will start but database/cache connections won't work (the config module itself works regardless).

See the [demo app README](apps/demo/README.md) for the complete endpoint reference and expected output.

---

## Project Structure

```
nestx-advanced-packages/
  .devcontainer/            Dev container configuration (Docker-based dev environment)
    devcontainer.json       VS Code dev container settings
    compose.yaml            Docker Compose for dev container services
    Dockerfile              Container image for development
    .env                    Default environment variables for dev services

  apps/                     Applications (demos, examples)
    demo/                   Demo application for @nestx/advanced-config
      src/
        main.ts             App entry point, calls printSafe() at startup
        app/
          app.module.ts     Root module using forRoot()
        config/             Configuration definitions (database, redis, app)
        modules/
          health/           Feature module using forFeature() with inline config
          showcase/         Controller with endpoints for every config feature
    demo-e2e/               End-to-end tests for the demo app

  packages/                 Publishable NPM packages
    advanced-config/        @nestx/advanced-config package
      src/
        index.ts            Public API barrel file
        lib/
          advanced-config.module.ts   The NestJS dynamic module
          config.service.ts           Injectable service (get, namespace, explain, printSafe)
          config-store.ts             Internal store with validation and O(1) lookup
          define-config.ts            Helper to create frozen config definitions
          constants.ts                Injection tokens
          interfaces/                 TypeScript interfaces and types
          loaders/                    EnvSource and loader implementations
          types/                      Path<T> and PathValue<T,P> recursive types
          utils/                      deep-freeze, mask-secrets, path-utils
      README.md             Full package documentation
      vitest.config.ts      Test configuration (100% coverage thresholds)

  docs/                     Documentation
    requirements/           Original requirements documents
    DEVELOPMENT.md          Development environment setup guide
    ARCHITECTURE.md         Architecture and design overview
    CONTRIBUTING.md         How to contribute to this project

  compose.yaml              Docker Compose for running demo standalone
  nx.json                   NX workspace configuration
  package.json              Root package.json (workspace scripts, shared deps)
  pnpm-workspace.yaml       pnpm workspace definition
  tsconfig.base.json        Shared TypeScript configuration
```

---

## Common Commands

All commands are run from the repository root.

### Building

```bash
pnpm build                    # Build all projects
pnpm nx build advanced-config # Build only the config package
pnpm nx build demo            # Build only the demo app
```

### Testing

```bash
pnpm test                     # Run all tests
pnpm nx test advanced-config  # Test only the config package
```

To run tests in watch mode (re-runs when files change):

```bash
pnpm nx test advanced-config --watch
```

To see code coverage:

```bash
pnpm nx test advanced-config --coverage
```

### Serving

```bash
pnpm nx serve demo                    # Start demo with hot reload (development)
pnpm nx serve demo --configuration=production  # Start in production mode
```

### Type Checking

```bash
pnpm typecheck                # Type check all projects
pnpm nx typecheck advanced-config  # Type check only the config package
```

### Formatting

```bash
npx prettier --write .        # Format all files
npx prettier --check .        # Check formatting without changing files
```

### NX Utilities

```bash
npx nx graph                  # Open the project dependency graph in a browser
npx nx show project demo      # Show project details and available targets
npx nx show project advanced-config  # Show config package targets
npx nx affected -t test       # Run tests only for projects affected by your changes
npx nx affected -t build      # Build only affected projects
```

---

## Understanding Key Concepts

### What is NX?

NX is a build system for monorepos. It does three important things:

1. **Dependency graph** -- It understands that `demo` depends on `advanced-config`, so it builds `advanced-config` first.
2. **Caching** -- If nothing changed in a package, NX skips rebuilding/retesting it. This makes repeated builds fast.
3. **Affected commands** -- `nx affected -t test` only tests packages that changed since the last commit.

You interact with NX through the `pnpm nx` (or `npx nx`) command. Each project has "targets" (like `build`, `test`, `serve`) defined in its `project.json`.

### What is a Dynamic Module?

In NestJS, a [dynamic module](https://docs.nestjs.com/fundamentals/dynamic-modules) is a module whose behavior can be configured when you import it. `@nestx/advanced-config` is a dynamic module with three registration methods:

- **`forRoot()`** -- Called once in the root module. Sets up the global config store.
- **`forRootAsync()`** -- Same as `forRoot()` but supports async initialization (e.g., fetching secrets from a vault).
- **`forFeature()`** -- Called in feature modules to register additional config namespaces.

### What is Zod?

[Zod](https://zod.dev) is a TypeScript-first schema validation library. In this project, it:

- Validates configuration values at application startup
- Provides default values for optional settings
- Generates TypeScript types automatically from schemas

If your config is invalid (wrong type, missing required field, out of range), the app fails immediately at startup with a clear error message -- not at 3 AM when a user triggers the buggy code path.

---

## Dev Container

This repository includes a [dev container](https://containers.dev/) configuration for consistent, secure development environments. It is configured following banking/fintech security standards:

- **Non-root user** -- The container runs as the `node` user, not `root`
- **Capability drops** -- All Linux capabilities are dropped (`cap_drop: ALL`)
- **No privilege escalation** -- `no-new-privileges` security option is set
- **Read-only filesystems** -- Infrastructure containers (PostgreSQL, Redis) use read-only root filesystems
- **Resource limits** -- Memory and CPU limits prevent runaway processes
- **No Docker socket** -- Docker CLI works via Docker-outside-of-Docker, without exposing the host socket

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full setup instructions.

---

## Documentation

| Document                                                     | Description                                    |
| ------------------------------------------------------------ | ---------------------------------------------- |
| **This file**                                                | Repository overview and getting started        |
| [Development Guide](docs/DEVELOPMENT.md)                     | How to set up your development environment     |
| [Architecture](docs/ARCHITECTURE.md)                         | How the code is organized and why              |
| [Contributing](docs/CONTRIBUTING.md)                         | Code style, commit conventions, and PR process |
| [@nestx/advanced-config](packages/advanced-config/README.md) | Full package documentation with API reference  |
| [Demo App](apps/demo/README.md)                              | Demo app endpoints and usage                   |

---

## Troubleshooting

### `pnpm install` fails with EPERM errors (Windows)

This is common on Windows due to antivirus software locking files. Fix it by changing the pnpm store location:

```bash
pnpm config set store-dir "$env:LOCALAPPDATA\pnpm\store"
pnpm install
```

### `nx` command not found

NX is a dev dependency, not a global install. Use `pnpm nx` or `npx nx` instead of `nx` directly:

```bash
pnpm nx build advanced-config  # correct
nx build advanced-config       # may fail if not installed globally
```

### Tests fail with "namespace already registered"

The `ConfigStore` is a static singleton. If you're writing tests, call `AdvancedConfigModule.reset()` in `beforeEach`:

```typescript
import { AdvancedConfigModule } from '@nestx/advanced-config';

beforeEach(() => {
  AdvancedConfigModule.reset();
});
```

### Docker Compose containers won't start

Make sure Docker Desktop is running, then try:

```bash
docker compose down -v   # Remove old containers and volumes
docker compose up --build  # Rebuild and start fresh
```

### Port 3000 is already in use

Either stop the process using port 3000, or override the port:

```bash
PORT=3001 pnpm nx serve demo
```

---

## License

MIT
