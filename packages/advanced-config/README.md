# @nestx/advanced-config

Enterprise-grade, type-safe dynamic configuration module for NestJS. Designed for banking, financial services, and mission-critical applications requiring strict validation, secret management, runtime immutability, and auditable configuration provenance.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Defining Configuration](#defining-configuration)
  - [defineConfig()](#defineconfig)
  - [Configuration Schemas with Zod](#configuration-schemas-with-zod)
  - [Configuration Loaders](#configuration-loaders)
  - [Secret Key Declaration](#secret-key-declaration)
- [Module Registration](#module-registration)
  - [forRoot() -- Synchronous](#forroot----synchronous)
  - [forRootAsync() -- Asynchronous](#forrootasync----asynchronous)
  - [forFeature() -- Feature Modules](#forfeature----feature-modules)
- [Using Configuration at Runtime](#using-configuration-at-runtime)
  - [ConfigService](#configservice)
  - [Dot-Notation Path Access](#dot-notation-path-access)
  - [Namespace Access](#namespace-access)
  - [Configuration Diagnostics](#configuration-diagnostics)
  - [Safe Printing](#safe-printing)
- [Environment Variable Loading](#environment-variable-loading)
  - [EnvSource API](#envsource-api)
  - [Required vs Optional Variables](#required-vs-optional-variables)
  - [Type Coercion](#type-coercion)
- [Configuration Overrides](#configuration-overrides)
- [Security](#security)
  - [Secret Masking](#secret-masking)
  - [Immutability via Deep Freeze](#immutability-via-deep-freeze)
  - [Namespace Isolation](#namespace-isolation)
- [Performance](#performance)
- [Type System](#type-system)
- [Extensibility](#extensibility)
  - [SecretSource Interface](#secretsource-interface)
  - [FileSource Interface](#filesource-interface)
  - [Custom EnvSource](#custom-envsource)
- [Testing](#testing)
  - [Unit Testing with Overrides](#unit-testing-with-overrides)
  - [Integration Testing](#integration-testing)
  - [Resetting State Between Tests](#resetting-state-between-tests)
- [Real-World Use Cases](#real-world-use-cases)
  - [Multi-Database Banking Application](#multi-database-banking-application)
  - [Microservice with Feature Flags](#microservice-with-feature-flags)
  - [Async Initialization from a Vault](#async-initialization-from-a-vault)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [License](#license)

---

## Features

| Capability              | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| **Dynamic Module**      | `forRoot()`, `forRootAsync()`, `forFeature()` following NestJS conventions  |
| **Zod Validation**      | Schema-based validation with structured error messages at startup           |
| **Type-Safe Access**    | Recursive `Path<T>` / `PathValue<T, P>` types for dot-notation autocomplete |
| **Secret Masking**      | Declared secret keys are masked as `********` in logs and diagnostics       |
| **Deep Freeze**         | All configuration objects are recursively frozen after validation           |
| **O(1) Lookup**         | Pre-compiled flat key map for constant-time access by dot-path              |
| **Typed Env Loaders**   | `getString`, `getNumber`, `getBoolean` with clear error messages            |
| **Config Overrides**    | Per-namespace overrides for testing and environment profiles                |
| **Diagnostics**         | `explain()` traces where each value came from (loader, default, override)   |
| **Namespace Isolation** | Each config has a unique namespace; collisions are detected at startup      |
| **Zero Runtime Deps**   | Only NestJS peer dependencies and Zod -- no transitive supply chain risk    |

---

## Installation

```bash
pnpm add @nestx/advanced-config zod
```

### Peer Dependencies

Ensure your application has the following installed:

```bash
pnpm add @nestjs/common @nestjs/core rxjs
```

| Peer Dependency  | Required Version       |
| ---------------- | ---------------------- |
| `@nestjs/common` | `^10.0.0 \|\| ^11.0.0` |
| `@nestjs/core`   | `^10.0.0 \|\| ^11.0.0` |
| `rxjs`           | `^7.0.0`               |
| `zod`            | `^3.20.0 \|\| ^4.0.0`  |

---

## Architecture Overview

```
                                AdvancedConfigModule
                               ┌─────────────────────────────────┐
                               │                                 │
  forRoot(options) ──────────► │  ┌───────────┐   ┌───────────┐  │
                               │  │ EnvSource │──►│  Loaders   │  │
  forRootAsync(options) ─────► │  └───────────┘   └─────┬─────┘  │
                               │                        │        │
  forFeature(configs...) ────► │                  ┌─────▼─────┐  │
                               │                  │ ConfigStore│  │
                               │                  │            │  │
                               │                  │ ┌────────┐ │  │
                               │                  │ │Validate│ │  │
                               │                  │ │(Zod)   │ │  │
                               │                  │ ├────────┤ │  │
                               │                  │ │Freeze  │ │  │
                               │                  │ ├────────┤ │  │
                               │                  │ │Lookup  │ │  │
                               │                  │ │Map O(1)│ │  │
                               │                  │ └────────┘ │  │
                               │                  └─────┬─────┘  │
                               │                        │        │
                               │                  ┌─────▼──────┐ │
                               │                  │ConfigService│ │
                               │                  │ get()       │ │
                               │                  │ namespace() │ │
                               │                  │ explain()   │ │
                               │                  │ printSafe() │ │
                               │                  └────────────┘ │
                               └─────────────────────────────────┘
```

**Data flow:**

1. Configuration definitions are registered via `forRoot()` or `forFeature()`
2. Each definition's `load()` function is invoked with an `EnvSource` context
3. Returned data is merged with any overrides
4. The merged object is validated against the Zod schema
5. Validated data is deep-frozen for immutability
6. A flat lookup map is built for O(1) access by dot-path
7. `ConfigService` is made available to the entire application

---

## Quick Start

### 1. Define your configuration

```typescript
// src/config/database.config.ts
import { defineConfig } from '@nestx/advanced-config';
import { z } from 'zod';

export const databaseConfig = defineConfig({
  namespace: 'database',
  schema: z.object({
    host: z.string(),
    port: z.number().default(5432),
    name: z.string(),
    password: z.string(),
    ssl: z.boolean().default(true),
    poolSize: z.number().min(1).max(100).default(10),
  }),
  load: ({ env }) => ({
    host: env.getString('DB_HOST'),
    port: env.getNumber('DB_PORT', 5432),
    name: env.getString('DB_NAME'),
    password: env.getString('DB_PASSWORD'),
    ssl: env.getBoolean('DB_SSL', true),
    poolSize: env.getNumber('DB_POOL_SIZE', 10),
  }),
  secretKeys: ['password'],
});
```

### 2. Register in your root module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AdvancedConfigModule } from '@nestx/advanced-config';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    AdvancedConfigModule.forRoot({
      configs: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

### 3. Inject and use

```typescript
// src/database/database.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestx/advanced-config';

@Injectable()
export class DatabaseService {
  constructor(private readonly config: ConfigService) {}

  getConnectionString(): string {
    const host = this.config.get('database.host' as any);
    const port = this.config.get('database.port' as any);
    const name = this.config.get('database.name' as any);
    return `postgres://${host}:${port}/${name}`;
  }
}
```

---

## Defining Configuration

### defineConfig()

`defineConfig()` creates a frozen, immutable `ConfigDefinition` object. It validates the inputs at call time and freezes the result to prevent accidental mutation.

```typescript
import { defineConfig } from '@nestx/advanced-config';
import { z } from 'zod';

const config = defineConfig({
  namespace: 'app',        // unique identifier (required)
  schema: z.object({...}), // Zod schema (required)
  load: ({ env }) => ({    // loader function (optional)
    ...
  }),
  secretKeys: ['apiKey'],  // keys to mask in logs (optional)
});
```

| Option       | Type                               | Required | Description                                                                                                                     |
| ------------ | ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `namespace`  | `string`                           | Yes      | Unique identifier for this config block. Used as the prefix in dot-paths (e.g., `database.url`).                                |
| `schema`     | `ZodSchema`                        | Yes      | Zod schema that validates the configuration. Provides defaults, type coercion, and constraints.                                 |
| `load`       | `(ctx: LoadContext) => Partial<T>` | No       | Loader function that produces the raw configuration from environment variables, secrets, or files.                              |
| `secretKeys` | `string[]`                         | No       | Top-level keys within this namespace that contain sensitive data. These are masked in `printSafe()` and flagged in `explain()`. |

The returned `ConfigDefinition` is frozen (`Object.isFrozen(config) === true`) and its `secretKeys` array is also frozen.

### Configuration Schemas with Zod

Zod schemas serve three purposes:

1. **Validation** -- the loaded configuration is validated at application startup. Invalid configuration causes the application to fail fast with a structured error.
2. **Defaults** -- Zod's `.default()` provides fallback values when the loader omits a key.
3. **Type inference** -- TypeScript infers the shape of your configuration from the schema.

```typescript
const schema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(5432),
  ssl: z.boolean().default(true),
  maxRetries: z.number().min(0).max(10).default(3),
  connectionTimeout: z.number().min(100).max(30000).default(5000),
  tags: z.array(z.string()).default([]),
  mode: z.enum(['read', 'write', 'read-write']).default('read-write'),
});
```

**Validation errors are structured and actionable:**

```
Config validation failed for namespace "database":
  database.host: String must contain at least 1 character(s)
  database.port: Number must be less than or equal to 65535
```

### Configuration Loaders

The `load` function receives a `LoadContext` with typed accessors for environment variables, secrets, and files.

```typescript
interface LoadContext {
  env: IEnvSource; // typed environment variable access
  secrets?: SecretSource; // async secret store (Vault, KMS, etc.)
  files?: FileSource; // file-based config (JSON, YAML, text)
}
```

A loader returns a `Partial<T>` of the schema's inferred type. Missing keys will fall through to Zod defaults.

```typescript
const config = defineConfig({
  namespace: 'auth',
  schema: z.object({
    issuer: z.string().url(),
    clientId: z.string(),
    audience: z.string().optional(),
    tokenExpiry: z.number().default(3600),
  }),
  load: ({ env }) => ({
    issuer: env.getString('OIDC_ISSUER'),
    clientId: env.getString('OIDC_CLIENT_ID'),
    audience: env.getOptionalString('OIDC_AUDIENCE'),
    // tokenExpiry not loaded -- Zod default (3600) applies
  }),
});
```

**When no loader is provided**, all values come from Zod defaults:

```typescript
const featureFlags = defineConfig({
  namespace: 'features',
  schema: z.object({
    darkMode: z.boolean().default(false),
    betaProgram: z.boolean().default(false),
    maxUploadSizeMb: z.number().default(50),
  }),
  // no load function -- all defaults
});
```

### Secret Key Declaration

Secret keys are declared as top-level property names within a namespace. They affect two behaviors:

1. `printSafe()` masks their values as `********` in log output.
2. `explain()` sets `isSecret: true` in the returned diagnostics.

```typescript
const config = defineConfig({
  namespace: 'database',
  schema: z.object({
    url: z.string(),
    password: z.string(),
    sslCert: z.string(),
  }),
  load: ({ env }) => ({
    url: env.getString('DB_URL'),
    password: env.getString('DB_PASSWORD'),
    sslCert: env.getString('DB_SSL_CERT'),
  }),
  secretKeys: ['password', 'sslCert'],
});
```

---

## Module Registration

### forRoot() -- Synchronous

Use `forRoot()` when all configuration can be resolved synchronously at startup. This is the most common pattern.

```typescript
AdvancedConfigModule.forRoot({
  configs: [databaseConfig, authConfig, cacheConfig],
  isGlobal: true, // default: true -- available to all modules
});
```

| Option      | Type                                      | Default       | Description                                                                 |
| ----------- | ----------------------------------------- | ------------- | --------------------------------------------------------------------------- |
| `configs`   | `ConfigDefinition[]`                      | --            | Array of config definitions created with `defineConfig()`                   |
| `envSource` | `Record<string, string \| undefined>`     | `process.env` | Override the environment variable source. Useful for testing.               |
| `overrides` | `Record<string, Record<string, unknown>>` | --            | Per-namespace value overrides. Applied after loading, before validation.    |
| `isGlobal`  | `boolean`                                 | `true`        | When `true`, `ConfigService` is available in all modules without importing. |
| `strict`    | `boolean`                                 | --            | Reserved for future use.                                                    |
| `cache`     | `boolean`                                 | --            | Reserved for future use.                                                    |

**Multiple configs in a single forRoot:**

```typescript
AdvancedConfigModule.forRoot({
  configs: [databaseConfig, redisConfig, authConfig, loggingConfig],
});
```

### forRootAsync() -- Asynchronous

Use `forRootAsync()` when configuration depends on other providers (e.g., a secret store, an HTTP client, or another NestJS service).

**Using `useFactory`:**

```typescript
AdvancedConfigModule.forRootAsync({
  imports: [VaultModule],
  useFactory: (vault: VaultService) => ({
    configs: [databaseConfig, authConfig],
    envSource: process.env,
  }),
  inject: [VaultService],
});
```

**Using `useClass`:**

```typescript
@Injectable()
class ConfigFactory implements AdvancedConfigOptionsFactory {
  constructor(private readonly vault: VaultService) {}

  async createAdvancedConfigOptions(): Promise<AdvancedConfigModuleOptions> {
    await this.vault.authenticate();
    return {
      configs: [databaseConfig],
    };
  }
}

AdvancedConfigModule.forRootAsync({
  imports: [VaultModule],
  useClass: ConfigFactory,
});
```

**Using `useExisting`:**

```typescript
// Reuses an already-registered factory provider
AdvancedConfigModule.forRootAsync({
  imports: [SharedModule],
  useExisting: ConfigFactory,
});
```

### forFeature() -- Feature Modules

Use `forFeature()` to register additional configuration namespaces from feature modules. Feature configs are added to the same global store and become accessible through `ConfigService`.

`forFeature()` accepts both `defineConfig()` output and plain options objects, allowing inline definitions without a separate `defineConfig()` call.

**With pre-built definitions:**

```typescript
// payments/payments.module.ts
@Module({
  imports: [AdvancedConfigModule.forFeature(paymentsConfig)],
})
export class PaymentsModule {}
```

**With inline plain options:**

```typescript
@Module({
  imports: [
    AdvancedConfigModule.forFeature({
      namespace: 'notifications',
      schema: z.object({
        emailFrom: z.string().email().default('noreply@example.com'),
        smsEnabled: z.boolean().default(false),
        retryAttempts: z.number().default(3),
      }),
    }),
  ],
})
export class NotificationsModule {}
```

**Mixing both forms:**

```typescript
AdvancedConfigModule.forFeature(paymentsConfig, {
  namespace: 'audit',
  schema: z.object({
    enabled: z.boolean().default(true),
    retentionDays: z.number().default(365),
  }),
});
```

**With a loader:**

```typescript
AdvancedConfigModule.forFeature({
  namespace: 'redis',
  schema: z.object({
    url: z.string().url(),
    password: z.string(),
    db: z.number().default(0),
  }),
  load: ({ env }) => ({
    url: env.getString('REDIS_URL'),
    password: env.getString('REDIS_PASSWORD'),
    db: env.getNumber('REDIS_DB', 0),
  }),
  secretKeys: ['password'],
});
```

---

## Using Configuration at Runtime

### ConfigService

`ConfigService` is the primary interface for accessing configuration at runtime. It is injected via NestJS dependency injection and is available globally when `isGlobal: true` (the default).

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestx/advanced-config';

@Injectable()
export class MyService {
  constructor(private readonly config: ConfigService) {}
}
```

`ConfigService` is generic. You can parameterize it for stronger typing:

```typescript
interface AppConfig {
  database: { host: string; port: number; password: string };
  auth: { issuer: string; clientId: string };
}

@Injectable()
export class MyService {
  constructor(private readonly config: ConfigService<AppConfig>) {}

  connect() {
    // TypeScript auto-completes valid paths
    const host = this.config.get('database.host');
    // host is inferred as `string`
  }
}
```

### Dot-Notation Path Access

`ConfigService.get(path)` retrieves a single value using dot-notation. Lookups execute in O(1) time via a pre-compiled flat map.

```typescript
const host = config.get('database.host' as any); // string
const port = config.get('database.port' as any); // number
const ssl = config.get('database.ssl' as any); // boolean
const issuer = config.get('auth.issuer' as any); // string
```

**Error on missing keys:**

```typescript
config.get('nonexistent.key' as any);
// throws: Configuration key "nonexistent.key" does not exist
```

### Namespace Access

`ConfigService.namespace(name)` returns the entire frozen config object for a namespace.

```typescript
const dbConfig = config.namespace('database' as any);
// { host: 'localhost', port: 5432, name: 'mydb', password: 'secret', ssl: true, poolSize: 10 }

Object.isFrozen(dbConfig); // true

// Attempts to mutate throw a TypeError
dbConfig.host = 'other'; // TypeError: Cannot assign to read only property
```

This is useful when you need to pass an entire config object to a library or driver:

```typescript
@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const redis = this.config.namespace('redis' as any);
    this.client = new Redis({
      host: redis.host,
      port: redis.port,
      password: redis.password,
    });
  }
}
```

### Configuration Diagnostics

`ConfigService.explain(path)` returns a `ConfigExplanation` object that traces where a value came from. This is invaluable for debugging configuration issues in production.

```typescript
const explanation = config.explain('database.password');
```

Returns:

```typescript
{
  path: 'database.password',
  namespace: 'database',
  key: 'password',
  value: 'my-secret-password',
  source: 'loader',     // 'loader' | 'default' | 'override'
  isSecret: true
}
```

| Field       | Type                                  | Description                               |
| ----------- | ------------------------------------- | ----------------------------------------- |
| `path`      | `string`                              | The full dot-path that was queried        |
| `namespace` | `string`                              | The namespace portion of the path         |
| `key`       | `string`                              | The key portion within the namespace      |
| `value`     | `unknown`                             | The actual runtime value                  |
| `source`    | `'loader' \| 'default' \| 'override'` | Where the value came from                 |
| `isSecret`  | `boolean`                             | Whether this key was declared as a secret |

**Source values:**

- `'loader'` -- The value was populated by the `load()` function
- `'default'` -- The value fell through to a Zod schema default
- `'override'` -- The value was explicitly overridden via the `overrides` option

**Use case -- health check endpoint:**

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get('config')
  getConfigDiagnostics() {
    return {
      database: {
        host: this.config.explain('database.host'),
        port: this.config.explain('database.port'),
        ssl: this.config.explain('database.ssl'),
      },
    };
  }
}
```

### Safe Printing

`ConfigService.printSafe()` logs the entire configuration tree to the NestJS logger with all secret values masked. Call this at application startup for audit logging.

```typescript
@Injectable()
export class AppBootstrapService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.config.printSafe();
  }
}
```

Produces:

```
[ConfigStore] Configuration:
{
  "database": {
    "host": "db.production.internal",
    "port": 5432,
    "name": "banking_core",
    "password": "********",
    "ssl": true,
    "poolSize": 10
  },
  "auth": {
    "issuer": "https://sso.bank.com",
    "clientId": "core-api",
    "audience": "https://api.bank.com"
  }
}
```

---

## Environment Variable Loading

### EnvSource API

`EnvSource` is a typed wrapper around environment variables. It is automatically created by the module and injected into loader functions via the `LoadContext`.

| Method                      | Return Type            | Description                                                     |
| --------------------------- | ---------------------- | --------------------------------------------------------------- |
| `getString(key, default?)`  | `string`               | Returns the value. Throws if missing and no default.            |
| `getNumber(key, default?)`  | `number`               | Parses to number. Throws if non-numeric or missing.             |
| `getBoolean(key, default?)` | `boolean`              | Parses to boolean. Throws if invalid or missing.                |
| `getOptionalString(key)`    | `string \| undefined`  | Returns the value or `undefined`. Never throws.                 |
| `getOptionalNumber(key)`    | `number \| undefined`  | Parses to number or returns `undefined`. Throws if non-numeric. |
| `getOptionalBoolean(key)`   | `boolean \| undefined` | Parses to boolean or returns `undefined`. Throws if invalid.    |

### Required vs Optional Variables

**Required** methods (`getString`, `getNumber`, `getBoolean`) throw descriptive errors when a variable is not set:

```
Environment variable DB_HOST is required but not set
```

**Optional** methods (`getOptionalString`, `getOptionalNumber`, `getOptionalBoolean`) return `undefined` when the variable is missing, allowing Zod defaults to take over:

```typescript
load: ({ env }) => ({
  host: env.getString('DB_HOST'), // required -- throws if missing
  port: env.getNumber('DB_PORT', 5432), // required with default
  debugMode: env.getOptionalBoolean('DB_DEBUG'), // optional -- undefined if unset
});
```

### Type Coercion

**Numbers:** The raw string is parsed with `Number()`. NaN values throw:

```
Environment variable DB_PORT must be a valid number, received: "not-a-number"
```

**Booleans:** The following string values are recognized (case-insensitive):

| Truthy             | Falsy              |
| ------------------ | ------------------ |
| `true`, `1`, `yes` | `false`, `0`, `no` |

Any other value throws:

```
Environment variable ENABLE_SSL must be a boolean (true/false/1/0/yes/no), received: "maybe"
```

**Empty strings** are treated as "not set" -- they will trigger defaults or throw for required variables, just like `undefined`.

---

## Configuration Overrides

Overrides let you replace specific values after loading but before validation. They are keyed by namespace.

```typescript
AdvancedConfigModule.forRoot({
  configs: [databaseConfig, cacheConfig],
  overrides: {
    database: {
      host: 'localhost',
      ssl: false,
    },
    cache: {
      ttl: 60,
    },
  },
});
```

**Override precedence:** `Zod defaults < loader values < overrides`

Overrides are applied with a shallow merge per namespace:

```typescript
// Loader returns:   { host: 'prod-db.internal', port: 5432, ssl: true }
// Override applies:  { host: 'localhost', ssl: false }
// Merged result:     { host: 'localhost', port: 5432, ssl: false }
// Then validated by Zod schema
```

**Primary use cases:**

1. **Test environments:** Override production values for integration testing
2. **Environment profiles:** Apply staging-specific settings
3. **Local development:** Override without changing `.env` files

---

## Security

### Secret Masking

Any key listed in `secretKeys` is masked as `********` in all logging and safe-print operations. The actual value remains accessible through `ConfigService.get()` and `ConfigService.namespace()` at runtime.

```typescript
const config = defineConfig({
  namespace: 'payments',
  schema: z.object({ apiKey: z.string(), webhookUrl: z.string() }),
  load: ({ env }) => ({
    apiKey: env.getString('STRIPE_API_KEY'),
    webhookUrl: env.getString('STRIPE_WEBHOOK_URL'),
  }),
  secretKeys: ['apiKey'],
});
```

`printSafe()` output:

```json
{
  "payments": {
    "apiKey": "********",
    "webhookUrl": "https://api.example.com/webhooks/stripe"
  }
}
```

`explain()` flags secrets:

```typescript
config.explain('payments.apiKey');
// { ..., isSecret: true, value: 'sk_live_...' }
```

### Immutability via Deep Freeze

All validated configuration objects are recursively frozen using `Object.freeze()`. This prevents accidental (or malicious) mutation at runtime.

```typescript
const db = config.namespace('database' as any);

db.host = 'hacked';
// TypeError: Cannot assign to read only property 'host' of object '#<Object>'
```

This guarantee extends to nested objects:

```typescript
const nested = config.get('app.logging' as any);
nested.level = 'debug';
// TypeError: Cannot assign to read only property 'level'
```

### Namespace Isolation

Each configuration definition must have a unique namespace. Attempting to register two definitions with the same namespace throws immediately at startup:

```
Configuration namespace "database" is already registered. Each namespace must be unique.
```

This prevents configuration from different modules from silently overwriting each other.

---

## Performance

Configuration access is optimized for high-throughput applications:

1. **O(1) lookup** -- At registration time, a flat `Map<string, unknown>` is built from the nested configuration. `config.get('database.url')` is a single map lookup, not recursive object traversal.

2. **Pre-compiled at startup** -- All parsing, validation, freezing, and map building happens once during module initialization. Runtime access has zero parsing overhead.

3. **No serialization** -- Values are stored in their native TypeScript types. No JSON parsing on each access.

4. **Frozen references** -- Since config objects are frozen, the runtime can optimize property access knowing values never change.

---

## Type System

The library provides two recursive utility types for type-safe dot-path access:

### `Path<T>`

Produces a union of all valid dot-notation paths for a given type.

```typescript
interface AppConfig {
  database: { host: string; port: number };
  auth: { issuer: string };
}

type ValidPaths = Path<AppConfig>;
// "database" | "database.host" | "database.port" | "auth" | "auth.issuer"
```

### `PathValue<T, P>`

Resolves the value type at a given path.

```typescript
type HostType = PathValue<AppConfig, 'database.host'>; // string
type PortType = PathValue<AppConfig, 'database.port'>; // number
```

**Depth limit:** Recursion stops at depth 5 to prevent TypeScript compiler slowdowns on deeply nested types.

**Usage with ConfigService:**

```typescript
@Injectable()
export class MyService {
  constructor(private readonly config: ConfigService<AppConfig>) {}

  getHost(): string {
    return this.config.get('database.host'); // autocomplete + type inference
  }
}
```

---

## Extensibility

### SecretSource Interface

The `SecretSource` interface defines a contract for retrieving secrets from external stores (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, etc.). Concrete implementations belong in separate packages.

```typescript
interface SecretSource {
  get(key: string): Promise<string>;
  getOptional(key: string): Promise<string | undefined>;
}
```

**Planned usage:**

```typescript
load: async ({ env, secrets }) => ({
  host: env.getString('DB_HOST'),
  password: await secrets!.get('database/password'),
});
```

### FileSource Interface

The `FileSource` interface defines a contract for loading configuration from files.

```typescript
interface FileSource {
  json(path: string): unknown;
  yaml(path: string): unknown;
  text(path: string): string;
}
```

### Custom EnvSource

You can implement `IEnvSource` for custom environment variable backends:

```typescript
interface IEnvSource {
  getString(key: string, defaultValue?: string): string;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  getOptionalString(key: string): string | undefined;
  getOptionalNumber(key: string): number | undefined;
  getOptionalBoolean(key: string): boolean | undefined;
}
```

---

## Testing

### Unit Testing with Overrides

Use the `envSource` and `overrides` options to inject test values without touching real environment variables.

```typescript
const module = await Test.createTestingModule({
  imports: [
    AdvancedConfigModule.forRoot({
      configs: [databaseConfig],
      envSource: {
        DB_HOST: 'localhost',
        DB_NAME: 'test_db',
        DB_PASSWORD: 'test-password',
      },
      overrides: {
        database: {
          poolSize: 1,
          ssl: false,
        },
      },
    }),
  ],
}).compile();

const config = module.get(ConfigService);
expect(config.get('database.host' as any)).toBe('localhost');
expect(config.get('database.poolSize' as any)).toBe(1);
expect(config.get('database.ssl' as any)).toBe(false);
```

### Integration Testing

Test the full NestJS module bootstrap with `Test.createTestingModule`:

```typescript
import { Test } from '@nestjs/testing';
import { AdvancedConfigModule, ConfigService } from '@nestx/advanced-config';

describe('AppModule integration', () => {
  it('should bootstrap with valid configuration', async () => {
    const module = await Test.createTestingModule({
      imports: [
        AdvancedConfigModule.forRoot({
          configs: [databaseConfig, authConfig],
          envSource: {
            DB_HOST: 'localhost',
            DB_NAME: 'test',
            DB_PASSWORD: 'pw',
            OIDC_ISSUER: 'https://auth.test.com',
            OIDC_CLIENT_ID: 'test-client',
          },
        }),
      ],
    }).compile();

    const config = module.get(ConfigService);
    expect(config.namespace('database' as any)).toBeDefined();
    expect(config.namespace('auth' as any)).toBeDefined();
  });

  it('should fail fast with invalid configuration', () => {
    expect(() =>
      AdvancedConfigModule.forRoot({
        configs: [databaseConfig],
        envSource: { DB_HOST: '', DB_NAME: '', DB_PASSWORD: '' },
      }),
    ).toThrow('Config validation failed');
  });
});
```

### Resetting State Between Tests

`AdvancedConfigModule.reset()` clears the internal store between test runs. Call it in `beforeEach`:

```typescript
import { AdvancedConfigModule } from '@nestx/advanced-config';

beforeEach(() => {
  AdvancedConfigModule.reset();
});
```

This is necessary because the `ConfigStore` is a static singleton. Without resetting, namespaces from one test will collide with the next.

---

## Real-World Use Cases

### Multi-Database Banking Application

```typescript
// config/primary-db.config.ts
export const primaryDbConfig = defineConfig({
  namespace: 'primaryDb',
  schema: z.object({
    url: z.string().url(),
    password: z.string(),
    ssl: z.boolean().default(true),
    poolSize: z.number().min(5).max(50).default(20),
    statementTimeout: z.number().default(30000),
    idleTimeout: z.number().default(10000),
  }),
  load: ({ env }) => ({
    url: env.getString('PRIMARY_DB_URL'),
    password: env.getString('PRIMARY_DB_PASSWORD'),
    ssl: env.getBoolean('PRIMARY_DB_SSL', true),
    poolSize: env.getNumber('PRIMARY_DB_POOL', 20),
  }),
  secretKeys: ['password'],
});

// config/audit-db.config.ts
export const auditDbConfig = defineConfig({
  namespace: 'auditDb',
  schema: z.object({
    url: z.string().url(),
    password: z.string(),
    ssl: z.boolean().default(true),
    poolSize: z.number().min(2).max(10).default(5),
  }),
  load: ({ env }) => ({
    url: env.getString('AUDIT_DB_URL'),
    password: env.getString('AUDIT_DB_PASSWORD'),
  }),
  secretKeys: ['password'],
});

// app.module.ts
@Module({
  imports: [
    AdvancedConfigModule.forRoot({
      configs: [primaryDbConfig, auditDbConfig],
    }),
  ],
})
export class AppModule {}
```

### Microservice with Feature Flags

```typescript
// Feature flags registered inline without defineConfig()
@Module({
  imports: [
    AdvancedConfigModule.forFeature({
      namespace: 'features',
      schema: z.object({
        instantPayments: z.boolean().default(false),
        newOnboarding: z.boolean().default(false),
        aiRiskScoring: z.boolean().default(false),
        maxTransactionLimit: z.number().default(10000),
      }),
      load: ({ env }) => ({
        instantPayments: env.getOptionalBoolean('FF_INSTANT_PAYMENTS'),
        newOnboarding: env.getOptionalBoolean('FF_NEW_ONBOARDING'),
        aiRiskScoring: env.getOptionalBoolean('FF_AI_RISK'),
        maxTransactionLimit: env.getOptionalNumber('FF_MAX_TXN_LIMIT'),
      }),
    }),
  ],
})
export class FeatureModule {}

// Usage
@Injectable()
export class PaymentService {
  constructor(private readonly config: ConfigService) {}

  async processPayment(amount: number) {
    const maxLimit = this.config.get('features.maxTransactionLimit' as any);
    if (amount > maxLimit) {
      throw new BadRequestException(`Amount exceeds limit of ${maxLimit}`);
    }

    const useInstant = this.config.get('features.instantPayments' as any);
    if (useInstant) {
      return this.processInstantPayment(amount);
    }
    return this.processStandardPayment(amount);
  }
}
```

### Async Initialization from a Vault

```typescript
@Injectable()
class VaultConfigFactory implements AdvancedConfigOptionsFactory {
  constructor(private readonly vault: VaultService) {}

  async createAdvancedConfigOptions(): Promise<AdvancedConfigModuleOptions> {
    const dbPassword = await this.vault.readSecret('database/password');
    const apiKey = await this.vault.readSecret('payments/api-key');

    return {
      configs: [
        defineConfig({
          namespace: 'database',
          schema: z.object({
            host: z.string(),
            port: z.number().default(5432),
            password: z.string(),
          }),
          load: ({ env }) => ({
            host: env.getString('DB_HOST'),
            port: env.getNumber('DB_PORT', 5432),
            password: dbPassword,
          }),
          secretKeys: ['password'],
        }),
        defineConfig({
          namespace: 'payments',
          schema: z.object({ apiKey: z.string(), currency: z.string().default('USD') }),
          load: () => ({ apiKey }),
          secretKeys: ['apiKey'],
        }),
      ],
    };
  }
}

@Module({
  imports: [
    AdvancedConfigModule.forRootAsync({
      imports: [VaultModule],
      useClass: VaultConfigFactory,
    }),
  ],
})
export class AppModule {}
```

---

## API Reference

### Exports

| Export                    | Kind     | Description                                                       |
| ------------------------- | -------- | ----------------------------------------------------------------- |
| `AdvancedConfigModule`    | Class    | Dynamic module with `forRoot()`, `forRootAsync()`, `forFeature()` |
| `ConfigService<T>`        | Class    | Injectable service for accessing configuration                    |
| `ConfigStore`             | Class    | Internal store (also injectable via `CONFIG_STORE` token)         |
| `defineConfig(options)`   | Function | Creates a frozen `ConfigDefinition`                               |
| `EnvSource`               | Class    | Typed `process.env` wrapper implementing `IEnvSource`             |
| `ADVANCED_CONFIG_OPTIONS` | Symbol   | Injection token for module options                                |
| `CONFIG_STORE`            | Symbol   | Injection token for the config store                              |

### Type Exports

| Export                             | Kind      | Description                                            |
| ---------------------------------- | --------- | ------------------------------------------------------ |
| `IEnvSource`                       | Interface | Contract for typed environment variable access         |
| `LoadContext`                      | Interface | Context passed to loader functions                     |
| `SecretSource`                     | Interface | Contract for async secret retrieval                    |
| `FileSource`                       | Interface | Contract for file-based config loading                 |
| `ConfigLoader<S>`                  | Type      | Signature of a loader function                         |
| `ConfigDefinitionOptions`          | Interface | Input options for `defineConfig()`                     |
| `ConfigDefinition`                 | Interface | Frozen output of `defineConfig()`                      |
| `ConfigDefinitionInput`            | Type      | Union of `ConfigDefinition \| ConfigDefinitionOptions` |
| `ConfigExplanation`                | Interface | Return type of `explain()`                             |
| `AdvancedConfigModuleOptions`      | Interface | Options for `forRoot()`                                |
| `AdvancedConfigModuleAsyncOptions` | Interface | Options for `forRootAsync()`                           |
| `AdvancedConfigOptionsFactory`     | Interface | Factory interface for `useClass` / `useExisting`       |
| `Path<T>`                          | Type      | Union of valid dot-notation paths for `T`              |
| `PathValue<T, P>`                  | Type      | Value type at path `P` in `T`                          |

### ConfigService Methods

| Method      | Signature                                  | Description                                                    |
| ----------- | ------------------------------------------ | -------------------------------------------------------------- |
| `get`       | `get<P>(path: P): PathValue<T, P>`         | O(1) value lookup by dot-path. Throws if not found.            |
| `namespace` | `namespace<K>(name: K): T[K]`              | Returns the frozen namespace object. Throws if not registered. |
| `explain`   | `explain(path: string): ConfigExplanation` | Diagnostics for a specific path.                               |
| `printSafe` | `printSafe(): void`                        | Logs all configuration with secrets masked.                    |

### EnvSource Methods

| Method               | Signature                                       | Description                                             |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `getString`          | `getString(key, default?): string`              | Returns string value. Throws if missing and no default. |
| `getNumber`          | `getNumber(key, default?): number`              | Parses to number. Throws if non-numeric or missing.     |
| `getBoolean`         | `getBoolean(key, default?): boolean`            | Parses to boolean. Throws if invalid or missing.        |
| `getOptionalString`  | `getOptionalString(key): string \| undefined`   | Returns value or `undefined`.                           |
| `getOptionalNumber`  | `getOptionalNumber(key): number \| undefined`   | Parses or returns `undefined`. Throws if non-numeric.   |
| `getOptionalBoolean` | `getOptionalBoolean(key): boolean \| undefined` | Parses or returns `undefined`. Throws if invalid.       |

---

## Best Practices

### 1. Fail fast on invalid configuration

Always define required fields without Zod defaults. The application should crash at startup if critical configuration is missing -- not at the first request.

```typescript
// Good: required fields fail fast
schema: z.object({
  url: z.string().url(), // no default -- must be provided
  port: z.number().default(5432), // safe default
});

// Bad: hiding required config behind defaults
schema: z.object({
  url: z.string().default(''), // will pass validation but fail at runtime
});
```

### 2. One namespace per bounded context

Align namespaces with domain boundaries:

```typescript
// Good
defineConfig({ namespace: 'database', ... })
defineConfig({ namespace: 'auth', ... })
defineConfig({ namespace: 'payments', ... })

// Bad: monolithic config
defineConfig({ namespace: 'app', schema: z.object({
  dbUrl: ..., dbPassword: ..., authIssuer: ..., stripeKey: ...
}) })
```

### 3. Always declare secret keys

Any value that should not appear in logs, error messages, or monitoring dashboards must be listed in `secretKeys`:

```typescript
secretKeys: ['password', 'apiKey', 'privateKey', 'token', 'secret'];
```

### 4. Use Zod constraints for validation

Leverage Zod's rich validation API to catch misconfigurations at startup:

```typescript
schema: z.object({
  port: z.number().int().min(1).max(65535),
  retries: z.number().int().min(0).max(10),
  timeout: z.number().min(100).max(60000),
  url: z.string().url(),
  email: z.string().email(),
  mode: z.enum(['development', 'staging', 'production']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});
```

### 5. Use overrides for testing, not mocked env vars

```typescript
// Good: deterministic, explicit
AdvancedConfigModule.forRoot({
  configs: [databaseConfig],
  envSource: { DB_HOST: 'localhost', DB_PASSWORD: 'test' },
  overrides: { database: { poolSize: 1 } },
});

// Bad: modifying global state
process.env.DB_HOST = 'localhost';
```

### 6. Print config at startup

Call `printSafe()` during bootstrap for operational visibility and audit compliance:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  config.printSafe();
  await app.listen(3000);
}
```

### 7. Use forFeature for domain-specific configs

Keep root-level config minimal. Let feature modules own their configuration:

```typescript
// app.module.ts -- only core infrastructure config
AdvancedConfigModule.forRoot({
  configs: [databaseConfig, loggingConfig],
});

// payments/payments.module.ts -- owns its own config
AdvancedConfigModule.forFeature(paymentsConfig);

// notifications/notifications.module.ts
AdvancedConfigModule.forFeature(notificationsConfig);
```

### 8. Reset between tests

Always call `AdvancedConfigModule.reset()` in `beforeEach` to avoid state leakage:

```typescript
beforeEach(() => {
  AdvancedConfigModule.reset();
});
```

---

## Further Reading

- [Repository README](../../README.md) -- Monorepo overview and getting started
- [Development Guide](../../docs/DEVELOPMENT.md) -- Setting up your environment
- [Architecture](../../docs/ARCHITECTURE.md) -- How the code is organized and design decisions
- [Contributing](../../docs/CONTRIBUTING.md) -- Code style, commit conventions, PR process
- [Demo Application](../../apps/demo/README.md) -- Live examples of every feature

---

## License

MIT
