---
applyTo: "packages/config/**"
---

# @neststack/config — Package Review Rules

This is the core configuration library for enterprise banking applications. Apply these rules in addition to the general security review instructions.

## Schema Validation

- Every config definition must use `defineConfig()` with a Zod schema — no unvalidated config objects
- Zod schemas must be strict (no `.passthrough()` or `.strip()`) to reject unexpected properties
- Default values in schemas must be safe and minimal — never default to permissive settings (e.g., `debug: true`, `cors: '*'`)
- Config loaders must validate all loaded values against the schema before returning — no partial or unvalidated config

## Secret Masking

- All sensitive config values (passwords, tokens, API keys, connection strings, certificates) must be declared in the `secretKeys` array of `defineConfig()`
- Review new `defineConfig()` calls for missing `secretKeys` — if a property name contains `password`, `secret`, `token`, `key`, `credential`, or `certificate`, it should be in `secretKeys`
- The `ConfigService.get()` method must never return unmasked secret values in log-safe contexts

## Immutability

- The `ConfigStore` deep-freezes all registered config — flag any code that attempts to bypass this freeze
- Never use `Object.assign()`, spread-then-mutate, or direct property writes on config objects
- Utility functions that receive config must accept `Readonly<T>` or `DeepReadonly<T>` types
- Test assertions should verify config immutability — any new config feature must include a freeze test

## Loaders

- Config loaders (env, file, etc.) must sanitize input sources:
  - Environment variable names: no path traversal characters, no shell metacharacters
  - File paths: must be resolved against a known base directory, no user-controlled path components
  - Remote sources: must use HTTPS, validate TLS certificates, and apply timeouts
- Loaders must handle errors gracefully — a failed load must not crash the application silently; it must throw a descriptive error or use the defined default

## Public API Surface

- All public exports must go through `src/index.ts` — no accidental exposure of internal utilities
- New public types, functions, or classes must be intentional and documented
- Breaking changes to the public API require a major version bump and migration guide

## Test Coverage

- This package targets 100% test coverage — every new feature or fix must include tests
- Colocate test files as `<name>.spec.ts` next to the source file
- Test both success and failure paths, especially for validation errors and edge cases
- Include integration tests for module registration patterns (`forRoot`, `forRootAsync`, `forFeature`)

## Existing Patterns to Follow

- `defineConfig()` in `define-config.ts` — the standard way to declare typed config with schema, defaults, and secret keys
- `ConfigStore` in `config-store.ts` — immutable store with O(1) path lookups via precomputed lookup maps
- `ConfigService` in `config.service.ts` — type-safe path access with automatic secret masking
- `NestStackConfigModule` in `neststack-config.module.ts` — dynamic module with `forRoot()` / `forRootAsync()` / `forFeature()`
