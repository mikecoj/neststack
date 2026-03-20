# Repository Instructions

## Project Identity

This is `@neststack/config` — an enterprise-grade, type-safe NestJS configuration module designed for banking and fintech applications. It lives in an Nx monorepo.

## Tech Stack

- **Runtime**: Node.js ≥22, NestJS 11, TypeScript 5.9 (strict mode)
- **Validation**: Zod 4 for schema validation at all boundaries
- **Build**: Nx 22 monorepo, pnpm 10
- **Quality**: Biome 2 (lint + format), Vitest 4 (100% coverage target)
- **Security**: CodeQL, dependency review, npm provenance, frozen lockfile

## Coding Conventions

- Named exports only — no default exports
- kebab-case file names, colocated `.spec.ts` test files
- Interfaces for object shapes, types for unions/intersections
- No `@ts-ignore` without written justification
- `strict: true` TypeScript — no loosening compiler checks
- 100-char line width, single quotes, trailing commas (Biome enforced)

## Security Posture

This library follows enterprise banking security standards. All code must be reviewed against OWASP Top 10 and PCI-DSS-aligned practices:

- **Immutable configuration**: All config is deep-frozen after registration — never mutate config objects
- **Secret masking**: Sensitive values declared in `secretKeys` are automatically masked in logs
- **Schema validation**: All configuration must pass Zod schema validation before use
- **Least privilege**: Services access only their own config namespaces

See [SECURITY.md](../SECURITY.md) for vulnerability reporting and the full security practices list.

## Build & Test Commands

Always use Nx to run tasks — never invoke tools directly:

```bash
pnpm nx run <project>:<target>        # single project
pnpm nx run-many -t <target>          # all projects
pnpm nx affected -t <target>          # changed projects only
```

Key targets: `build`, `test`, `lint`, `typecheck`, `format:check`

## Key Patterns

- `defineConfig()` — declares typed config with Zod schema, defaults, and secret keys
- `ConfigStore` — immutable store with O(1) path lookups and deep-freeze
- `ConfigService` — type-safe path access with automatic secret masking
- `forRoot()` / `forRootAsync()` / `forFeature()` — NestJS dynamic module registration
