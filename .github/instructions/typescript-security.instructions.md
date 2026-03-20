---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Security Patterns

Enforce these TypeScript-specific secure coding rules in all reviews and code generation. This codebase uses `strict: true` — leverage the type system as a security layer.

## Type Safety at Trust Boundaries

- Prefer `unknown` over `any` at trust boundaries (external input, API responses, deserialized data)
- Never use `any` to bypass type checking on data that crosses a trust boundary
- All external input (env vars, HTTP bodies, query params, file reads, message queues) must be validated through a Zod schema before use — raw casts are not acceptable
- No type assertions (`as SomeType`) to bypass validation — use Zod `.parse()` or `.safeParse()` and handle the validated output
- Flag `@ts-ignore` and `@ts-expect-error` — each must have a written justification and a linked issue for removal

## Dangerous APIs

- Flag `eval()`, `Function()`, `new Function()` — these must never appear in production code
- Flag `child_process.exec()` or `execSync()` with string interpolation of user input — require `execFile()` with argument arrays or a vetted sanitization strategy
- Flag dynamic `import()` with user-controlled paths — require static import paths or a strict allowlist
- Flag `JSON.parse()` on untrusted input without a Zod schema validation wrapper
- Flag `RegExp()` with user-supplied patterns — risk of ReDoS; require vetted patterns or input length limits

## Immutability and Mutation

- Require `readonly` modifiers on data structures that must not be mutated (config objects, validation results, shared state)
- Flag direct mutation of `Readonly<T>` or `DeepReadonly<T>` types via casts or workarounds
- Flag `Object.assign()` targeting frozen/readonly objects
- Prefer `as const` for literal configuration arrays and objects

## Null Safety

- Flag non-null assertions (`!`) at security-critical paths — require explicit null checks with proper error handling
- Prefer optional chaining (`?.`) with nullish coalescing (`??`) and a safe default over `!`
- Never use `!` to silence TypeScript on data that could actually be null/undefined at runtime

## Error Handling

- Flag empty `catch` blocks — at minimum log the error; for security-relevant operations, also emit an alert
- Never expose internal error details (stack traces, file paths, query text) in API responses — return generic error messages with a correlation ID
- Use typed error classes for domain errors — avoid throwing raw strings or generic `Error` objects in business logic

## Module and Import Safety

- No circular dependencies — flag circular import chains
- No wildcard re-exports (`export * from`) in public API surface (`index.ts`) — use explicit named exports to prevent accidental exposure of internal APIs
- Flag imports from `node:` modules that are unusual for this project type (`node:child_process`, `node:vm`, `node:dgram`) — require justification
