# Architecture

This document explains how the NestX monorepo is organized, how the `@nestx/advanced-config` package works internally, and the design decisions behind it. Read this if you want to understand *why* things are the way they are, not just *how* to use them.

---

## Table of Contents

- [Monorepo Layout](#monorepo-layout)
- [Dependency Graph](#dependency-graph)
- [Package: @nestx/advanced-config](#package-nestxadvanced-config)
  - [Module Lifecycle](#module-lifecycle)
  - [Data Flow](#data-flow)
  - [Internal Components](#internal-components)
  - [Type System](#type-system)
- [Demo Application](#demo-application)
- [Dev Container](#dev-container)
- [Design Decisions](#design-decisions)

---

## Monorepo Layout

The repository follows the standard NX monorepo layout with two main directories:

```
nestx-advanced-packages/
  packages/         Publishable NPM libraries
  apps/             Runnable applications (demos, services)
```

**Why a monorepo?** All `@nestx/*` packages share the same NestJS version, TypeScript config, and testing infrastructure. A monorepo lets us:

- Keep package versions in sync
- Share build and test configuration
- Test cross-package changes in a single commit
- Use NX's dependency graph and caching

### Configuration layers

```
tsconfig.base.json          Shared TypeScript settings (strict mode, path aliases)
  packages/*/tsconfig.json    Extends base, adds project-specific references
    packages/*/tsconfig.lib.json   Build config (declaration emit, spec exclusion)

nx.json                     Workspace-wide NX settings and plugins
  packages/*/project.json     Per-project targets (build, test)
  apps/*/project.json         Per-app targets (build, serve)

pnpm-workspace.yaml         Defines which directories contain packages
```

Each layer extends the one above it. A package's `tsconfig.json` extends `tsconfig.base.json`, so shared settings (like `strict: true`) are inherited everywhere.

---

## Dependency Graph

```
                     +---------+
                     |  demo   | (application)
                     +----+----+
                          |
                          | imports
                          v
                  +-------+--------+
                  | advanced-config | (library)
                  +-------+--------+
                          |
                          | peer dependencies
                          v
              +-----------+-----------+
              |  @nestjs/common       |
              |  @nestjs/core         |
              |  rxjs                 |
              |  zod                  |
              +-----+-----------+----+
```

**Key design choice**: `@nestx/advanced-config` declares NestJS and Zod as **peer dependencies**, not direct dependencies. This means:

- The consuming application controls which version of NestJS it uses
- There's only one copy of `@nestjs/core` in the final bundle (NestJS breaks with multiple copies)
- `zod` is also a direct dependency for the library itself to use at build time, while the peer dependency range (`^3.20.0 || ^4.0.0`) allows consumers flexibility

---

## Package: @nestx/advanced-config

### Module Lifecycle

Here's what happens when your NestJS app starts and `AdvancedConfigModule.forRoot()` is called:

```
1. App starts
   |
2. NestJS processes module imports
   |
3. AdvancedConfigModule.forRoot(options) is called
   |
4. For each config definition:
   |   a. Create EnvSource from options.envSource (or process.env)
   |   b. Call config.load({ env }) to get raw data
   |   c. Merge raw data with any overrides
   |   d. Validate merged data against Zod schema
   |   e. Deep-freeze the validated data
   |   f. Register in ConfigStore (builds O(1) lookup map)
   |   g. Track secret keys for masking
   |
5. ConfigService and ConfigStore are registered as providers
   |
6. Feature modules call forFeature() (same steps 4a-4g)
   |
7. App is ready -- ConfigService is injectable everywhere
```

### Data Flow

This diagram shows how a configuration value flows from source to consumer:

```
  Environment           defineConfig()
  Variables             (Zod Schema +
  (process.env)          Loader)
       |                    |
       v                    v
  +-----------+     +-------+--------+
  | EnvSource |---->| load({ env })  |    Raw data
  +-----------+     +-------+--------+
                            |
                            v
                    +-------+--------+
                    |  Merge with    |    Raw + overrides
                    |  overrides     |
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    | Zod validate   |    Validated data
                    | (.safeParse)   |    (or fail fast)
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    | Deep freeze    |    Immutable data
                    | (Object.freeze)|
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    | ConfigStore    |
                    | - namespaces   |    Map<namespace, data>
                    | - lookupMap    |    Map<"ns.key", value>
                    | - secretKeys   |    Set<"ns.key">
                    +-------+--------+
                            |
                    +-------+--------+
                    | ConfigService  |
                    | .get("ns.key") |    O(1) Map lookup
                    | .namespace()   |    Direct reference
                    | .explain()     |    Source tracing
                    | .printSafe()   |    Masked output
                    +----------------+
```

### Internal Components

#### ConfigStore (`config-store.ts`)

The ConfigStore is the heart of the system. It's a singleton (static on the module class) that holds all registered configuration.

**Data structures:**

| Field | Type | Purpose |
| --- | --- | --- |
| `namespaces` | `Map<string, NamespaceEntry>` | Stores validated, frozen data per namespace |
| `lookupMap` | `Map<string, unknown>` | Flat key-value map for O(1) dot-path access |
| `allSecretKeys` | `Set<string>` | Tracks which paths are secrets |

Each `NamespaceEntry` contains:

```typescript
{
  definition: ConfigDefinition;    // The original config definition
  data: Readonly<Record<string, unknown>>;  // Validated, frozen data
  source: Map<string, 'loader' | 'default' | 'override'>;  // Where each key came from
}
```

**Why a flat lookup map?** Instead of traversing `namespaces['database'].data['host']` on every access, we pre-build a flat map: `{ "database.host": "localhost", "database.port": 5432, ... }`. This gives true O(1) access time with a single `Map.get()` call.

**Why deep freeze?** Configuration should never change after startup. `Object.freeze()` (applied recursively) makes all config properties read-only. Accidental mutation throws a `TypeError` instead of silently corrupting state.

#### AdvancedConfigModule (`advanced-config.module.ts`)

The NestJS dynamic module. It has three static methods:

- **`forRoot(options)`** -- Creates a global module. Initializes `EnvSource`, processes all config definitions, registers `ConfigStore` and `ConfigService` as providers.

- **`forRootAsync(options)`** -- Same as `forRoot` but wraps initialization in a factory provider. Supports `useFactory`, `useClass`, and `useExisting` patterns for async initialization (e.g., fetching secrets from a vault before config can be built).

- **`forFeature(...configs)`** -- Registers additional namespaces in the existing global store. Accepts both `ConfigDefinition` objects (from `defineConfig()`) and plain `ConfigDefinitionOptions` objects (for inline definitions).

**Static state**: The module uses static properties (`globalStore`, `envSourceInstance`) because NestJS dynamic modules need the store to persist across `forRoot()` and `forFeature()` calls. The `reset()` method clears this state for testing.

#### ConfigService (`config.service.ts`)

A thin injectable wrapper around `ConfigStore`. It exists to provide:

- NestJS dependency injection (`@Injectable()`)
- Generic type parameter `<TConfig>` for typed access
- A clean public API surface

The service delegates all operations to the store.

#### defineConfig (`define-config.ts`)

A pure function that validates inputs and returns a frozen `ConfigDefinition`. It:

1. Validates that `namespace` is a non-empty string
2. Validates that `schema` is provided
3. Freezes the output object and the `secretKeys` array
4. Returns a `ConfigDefinition` (which is checked via `Object.isFrozen()` in `forFeature`)

#### EnvSource (`loaders/env-source.ts`)

A typed wrapper around a `Record<string, string | undefined>` (defaults to `process.env`). It provides six methods with consistent behavior:

- Required methods (`getString`, `getNumber`, `getBoolean`) throw if the variable is missing/empty and no default is provided
- Optional methods (`getOptionalString`, `getOptionalNumber`, `getOptionalBoolean`) return `undefined` for missing values

Empty strings are treated as "not set" to prevent accidentally using `""` as a valid value.

#### Utilities

| Utility | File | Purpose |
| --- | --- | --- |
| `deepFreeze` | `utils/deep-freeze.ts` | Recursively freezes objects and arrays |
| `maskSecrets` | `utils/mask-secrets.ts` | Deep-clones config and replaces secret values with `********` |
| `buildLookupMap` | `utils/path-utils.ts` | Flattens nested objects into `"prefix.key" => value` entries |
| `getByPath` | `utils/path-utils.ts` | Traverses an object by dot-path (used internally, not for runtime access) |

### Type System

The package provides two recursive types for type-safe dot-path access:

#### `Path<T>`

Generates a union of all valid dot-notation paths:

```typescript
type T = { database: { host: string; port: number }; app: { name: string } };
type Paths = Path<T>;
// "database" | "database.host" | "database.port" | "app" | "app.name"
```

#### `PathValue<T, P>`

Resolves the value type at a given path:

```typescript
type V = PathValue<T, "database.host">;  // string
```

**Depth limit**: Recursion stops at depth 5 to prevent TypeScript compiler slowdowns. In practice, config objects rarely exceed 3 levels of nesting.

---

## Demo Application

The demo app (`apps/demo/`) is structured to showcase every feature through HTTP endpoints:

```
AppModule (forRoot)
  |
  +-- databaseConfig    defineConfig with loader + secretKeys
  +-- redisConfig       defineConfig with loader + secretKeys  
  +-- appConfig         defineConfig with schema-only defaults
  |
  +-- HealthModule (forFeature with inline options)
  |     +-- GET /health          namespace()
  |     +-- GET /health/explain  explain()
  |
  +-- ShowcaseModule (uses global ConfigService)
        +-- GET /showcase/get/:path       get()
        +-- GET /showcase/namespace/:name namespace()
        +-- GET /showcase/explain/:path   explain()
        +-- GET /showcase/safe            getSafeAll()
        +-- GET /showcase/all             getAll()
        +-- GET /showcase/overrides       explain() for source tracing
```

The demo uses `isGlobal: true` in `forRoot()`, making `ConfigService` available in all modules without explicitly importing `AdvancedConfigModule`.

---

## Dev Container

The dev container architecture:

```
Docker Host (your machine)
  |
  +-- app container (Node.js 22 + pnpm)
  |     - Your code at /workspace (bind mount)
  |     - Non-root user: node
  |     - cap_drop: ALL, no-new-privileges
  |
  +-- db container (PostgreSQL 16 Alpine)
  |     - read_only root filesystem
  |     - Data on named volume (pgdata)
  |     - Minimal capabilities (CHOWN, SETGID, SETUID, FOWNER, DAC_READ_SEARCH)
  |     - 512MB RAM, 0.5 CPU limit
  |
  +-- redis container (Redis 7 Alpine)
        - read_only root filesystem
        - Data on named volume (redisdata)
        - Password-protected
        - 256MB RAM, 0.25 CPU limit
```

**Why read-only filesystems?** If an attacker compromises a container, they can't write to the filesystem (install malware, modify binaries). Only explicitly writable paths (`/tmp`, data volumes) are available.

**Why cap_drop: ALL?** Linux capabilities grant specific privileges. Dropping all capabilities and adding back only what's needed (e.g., `CHOWN` for PostgreSQL to set file ownership) follows the principle of least privilege.

---

## Design Decisions

### Why Zod instead of class-validator?

| Criteria | Zod | class-validator |
| --- | --- | --- |
| Type inference | Automatic from schema | Requires separate interface |
| Runtime + types | Single source of truth | Types and validation are separate |
| Composability | Schemas compose naturally | Requires class inheritance |
| Bundle size | Small (~50KB) | Larger with class-transformer |
| Default values | Built into `.default()` | Requires manual handling |

Zod provides both validation and TypeScript types from a single schema definition. With class-validator, you'd need to maintain both a class and an interface, which can drift apart.

### Why a static singleton for ConfigStore?

NestJS dynamic modules need to share state between `forRoot()` and `forFeature()` calls. Since these are static methods called at module decoration time (before DI is available), the store must be static. The `reset()` method exists specifically for test isolation.

### Why deep freeze instead of Proxy or ReadonlyDeep?

- `Object.freeze()` is a native, zero-cost operation. No runtime overhead after the initial freeze.
- `Proxy` would add overhead on every property access.
- `ReadonlyDeep` is TypeScript-only -- it doesn't prevent runtime mutation.
- Frozen objects throw `TypeError` on mutation, making bugs obvious immediately.

### Why O(1) lookup map instead of recursive traversal?

Configuration is read thousands of times during an application's lifetime but written only once at startup. Pre-building a flat `Map<string, unknown>` trades a few microseconds of startup time for zero-cost reads.

### Why peer dependencies for NestJS?

NestJS's dependency injection system breaks if there are multiple copies of `@nestjs/core` in the dependency tree. By declaring NestJS as a peer dependency, we ensure the library uses the same instance as the consuming application.
