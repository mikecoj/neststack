# @nestx/advanced-config Demo Application

A NestJS application that exercises every feature of the `@nestx/advanced-config` module through HTTP endpoints.

## Features Demonstrated

| Feature                                      | Where                                              |
| -------------------------------------------- | -------------------------------------------------- |
| `defineConfig()` with Zod schemas            | `src/config/database.config.ts`, `redis.config.ts` |
| Schema-only config (Zod defaults, no loader) | `src/config/app.config.ts`                         |
| `forRoot()` with multiple configs            | `src/app/app.module.ts`                            |
| `forFeature()` with inline plain options     | `src/modules/health/health.module.ts`              |
| `ConfigService.get()` (dot-path access)      | `GET /showcase/get/:path`                          |
| `ConfigService.namespace()` (frozen object)  | `GET /showcase/namespace/:name`                    |
| `ConfigService.explain()` (diagnostics)      | `GET /showcase/explain/:path`                      |
| `ConfigStore.getSafeAll()` (masked secrets)  | `GET /showcase/safe`                               |
| `ConfigStore.getAll()` (full config)         | `GET /showcase/all`                                |
| Override behavior                            | `GET /showcase/overrides`                          |
| `printSafe()` at startup                     | `src/main.ts`                                      |
| `secretKeys` masking                         | `database.password`, `redis.password`              |
| Environment variable loading                 | All loaders via `EnvSource`                        |

## Quick Start

### With Docker Compose (standalone)

From the repository root:

```bash
docker compose up --build
```

This starts the demo app on port 3000, along with PostgreSQL and Redis.

### With Dev Containers (VS Code)

1. Open the repository in VS Code
2. When prompted, click "Reopen in Container" (or use the command palette: `Dev Containers: Reopen in Container`)
3. Once the container is built:

```bash
pnpm nx serve demo
```

### Local Development (no Docker)

```bash
# From the repository root
export DB_HOST=localhost DB_PASSWORD=nestx_dev_secret REDIS_PASSWORD=redis_dev_secret
pnpm nx serve demo
```

## API Endpoints

### GET /health

Returns the health module's config, registered via `forFeature()` with inline plain options.

```bash
curl http://localhost:3000/health
```

Expected output:

```json
{
  "status": "ok",
  "config": {
    "intervalMs": 30000,
    "timeout": 5000
  }
}
```

### GET /health/explain

Returns `explain()` diagnostics for the health namespace keys.

```bash
curl http://localhost:3000/health/explain
```

Expected output:

```json
{
  "intervalMs": {
    "path": "health.intervalMs",
    "namespace": "health",
    "key": "intervalMs",
    "value": 30000,
    "source": "default",
    "isSecret": false
  },
  "timeout": {
    "path": "health.timeout",
    "namespace": "health",
    "key": "timeout",
    "value": 5000,
    "source": "default",
    "isSecret": false
  }
}
```

### GET /showcase/get/:path

Demonstrates `ConfigService.get()` with dot-path O(1) access.

```bash
curl http://localhost:3000/showcase/get/database.host
curl http://localhost:3000/showcase/get/app.name
curl http://localhost:3000/showcase/get/redis.port
```

Expected output:

```json
{
  "path": "database.host",
  "value": "db"
}
```

### GET /showcase/namespace/:name

Demonstrates `ConfigService.namespace()` returning a deep-frozen config object.

```bash
curl http://localhost:3000/showcase/namespace/database
curl http://localhost:3000/showcase/namespace/app
curl http://localhost:3000/showcase/namespace/redis
curl http://localhost:3000/showcase/namespace/health
```

Expected output:

```json
{
  "namespace": "app",
  "config": {
    "name": "nestx-demo",
    "port": 3000,
    "environment": "development",
    "debug": true
  }
}
```

### GET /showcase/explain/:path

Demonstrates `ConfigService.explain()` diagnostics showing value source, secret status.

```bash
curl http://localhost:3000/showcase/explain/database.password
curl http://localhost:3000/showcase/explain/database.ssl
curl http://localhost:3000/showcase/explain/app.port
```

Expected output (for a secret key):

```json
{
  "path": "database.password",
  "namespace": "database",
  "key": "password",
  "value": "nestx_dev_secret",
  "source": "loader",
  "isSecret": true
}
```

### GET /showcase/safe

Demonstrates `ConfigStore.getSafeAll()` -- all config with secrets masked.

```bash
curl http://localhost:3000/showcase/safe
```

Expected output:

```json
{
  "database": {
    "host": "db",
    "port": 5432,
    "name": "nestx_demo",
    "user": "nestx",
    "password": "********",
    "ssl": false,
    "poolSize": 10
  },
  "redis": {
    "host": "redis",
    "port": 6379,
    "password": "********",
    "db": 0
  },
  "app": {
    "name": "nestx-demo",
    "port": 3000,
    "environment": "development",
    "debug": true
  },
  "health": {
    "intervalMs": 30000,
    "timeout": 5000
  }
}
```

### GET /showcase/all

Demonstrates `ConfigStore.getAll()` -- full config dump (use in development only).

```bash
curl http://localhost:3000/showcase/all
```

### GET /showcase/overrides

Demonstrates how config overrides work and how `explain()` reveals the source of each value.

```bash
curl http://localhost:3000/showcase/overrides
```

Expected output:

```json
{
  "description": "Override values via forRoot({ overrides: { database: { poolSize: 50 } } }). Use explain to see which values come from overrides vs loaders vs defaults.",
  "examples": {
    "poolSize": {
      "path": "database.poolSize",
      "namespace": "database",
      "key": "poolSize",
      "value": 10,
      "source": "loader",
      "isSecret": false
    },
    "ssl": {
      "path": "database.ssl",
      "namespace": "database",
      "key": "ssl",
      "value": false,
      "source": "loader",
      "isSecret": false
    },
    "port": {
      "path": "app.port",
      "namespace": "app",
      "key": "port",
      "value": 3000,
      "source": "default",
      "isSecret": false
    }
  }
}
```

## Environment Variables

| Variable           | Default      | Description                          |
| ------------------ | ------------ | ------------------------------------ |
| `DB_HOST`          | `db`         | PostgreSQL host                      |
| `DB_PORT`          | `5432`       | PostgreSQL port                      |
| `DB_NAME`          | `nestx_demo` | Database name                        |
| `DB_USER`          | `nestx`      | Database user                        |
| `DB_PASSWORD`      | -            | Database password (required in prod) |
| `DB_SSL`           | `false`      | Enable SSL for database connection   |
| `DB_POOL_SIZE`     | `10`         | Connection pool size                 |
| `REDIS_HOST`       | `redis`      | Redis host                           |
| `REDIS_PORT`       | `6379`       | Redis port                           |
| `REDIS_PASSWORD`   | -            | Redis password (required in prod)    |
| `REDIS_DB`         | `0`          | Redis database index                 |
| `REDIS_KEY_PREFIX` | -            | Optional key prefix for Redis        |

## Architecture

```
src/
  main.ts                             Bootstrap + printSafe() at startup
  app/
    app.module.ts                     forRoot with database + redis + app configs
  config/
    index.ts                          Barrel exports
    database.config.ts                defineConfig: Postgres, loader + secretKeys
    redis.config.ts                   defineConfig: Redis, loader + secretKeys
    app.config.ts                     defineConfig: app-level (schema-only defaults)
  modules/
    health/
      health.module.ts                forFeature with inline plain options
      health.controller.ts            GET /health, GET /health/explain
    showcase/
      showcase.module.ts              Imports AdvancedConfigModule (global)
      showcase.controller.ts          All demo endpoints
```

## Further Reading

- [Repository README](../../README.md) -- Monorepo overview and getting started
- [@nestx/advanced-config Documentation](../../packages/advanced-config/README.md) -- Full package API reference
- [Development Guide](../../docs/DEVELOPMENT.md) -- Setting up your environment
- [Architecture](../../docs/ARCHITECTURE.md) -- How the code is organized and design decisions
- [Contributing](../../docs/CONTRIBUTING.md) -- Code style, commit conventions, PR process
