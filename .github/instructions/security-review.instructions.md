---
applyTo: "**"
---

# Security Review — OWASP Top 10 & Enterprise Banking Standards

When reviewing or generating code in this repository, enforce these security rules. This library is used in banking and fintech systems — treat every finding as high-severity.

## OWASP Top 10 Checklist

### A01 — Broken Access Control

- Flag missing authorization guards on controllers or routes
- Reject overly permissive decorators (e.g., `@Public()` on sensitive endpoints)
- Require ownership validation before returning or modifying resources — no direct object references without access checks
- Enforce RBAC: every state-changing endpoint must declare required roles

### A02 — Cryptographic Failures

- Reject hardcoded secrets, API keys, tokens, passwords, or connection strings in source code
- Flag weak hashing algorithms used for security purposes (MD5, SHA1) — require SHA-256+ or bcrypt/scrypt/argon2 for passwords
- Require environment-based secret management (env vars, secret managers) — never commit secrets
- Flag missing encryption for PII or financial data at rest or in transit

### A03 — Injection

- Require parameterized queries for all database interactions — flag string concatenation in SQL/NoSQL queries
- Require Zod schema validation at all API boundaries (HTTP bodies, query params, path params, headers)
- Flag unsanitized user input passed to shell commands (`child_process.exec`, `execSync`)
- Flag unescaped output in templates or responses that could enable XSS

### A04 — Insecure Design

- Enforce defense-in-depth: validation must happen at multiple layers (controller, service, repository)
- Require rate limiting on public-facing endpoints
- Flag missing audit logging for state-changing operations on sensitive data
- Require threat modeling for new features handling financial data or PII

### A05 — Security Misconfiguration

- Flag overly permissive CORS configurations (`origin: '*'` in production)
- Reject exposed stack traces or internal error details in API responses
- Flag debug mode, verbose logging, or development-only features enabled in non-dev configurations
- Require security headers (HSTS, Content-Security-Policy, X-Content-Type-Options) on HTTP responses
- Flag unnecessary or undocumented endpoints

### A06 — Vulnerable and Outdated Components

- Flag `"*"` or overly broad version ranges in `package.json` dependencies
- Prefer pinned versions or tight semver ranges
- Remind to run `pnpm audit` before merging dependency changes
- Flag dependencies with known CVEs

### A07 — Identification and Authentication Failures

- Flag session tokens or credentials passed in URLs or query parameters
- Require brute-force protection (account lockout, exponential backoff) on authentication endpoints
- Flag insecure token storage (localStorage for sensitive tokens, unencrypted cookies)
- Require secure cookie attributes (`HttpOnly`, `Secure`, `SameSite=Strict`) for auth cookies

### A08 — Software and Data Integrity Failures

- Require Zod schema validation on all deserialized external data (JSON.parse, API responses, file reads)
- Flag `JSON.parse()` on untrusted input without a schema validation wrapper
- Flag CI/CD pipeline modifications without code review (CODEOWNERS must cover `.github/workflows/`)
- Require integrity checks (checksums, signatures) for external artifacts

### A09 — Security Logging and Monitoring Failures

- Require structured logging (JSON format) for all services
- Flag sensitive data in log output: passwords, tokens, API keys, PII, financial account numbers, card numbers
- Enforce the `secretKeys` pattern in `defineConfig()` — all sensitive config values must be declared as secret keys for automatic masking
- Require audit trail logging for all CRUD operations on financial or PII data
- Flag missing error logging in catch blocks for security-relevant operations

### A10 — Server-Side Request Forgery (SSRF)

- Flag unvalidated user-supplied URLs used in HTTP requests, file reads, or redirects
- Require allowlists for external service calls — no open proxying of user-provided URLs
- Block requests to internal/private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254)

## Banking & Fintech Specific Rules

### Data Classification

- Identify and flag handling of PII (names, addresses, SSNs, email) and financial data (account numbers, card numbers, balances, transactions) without proper encryption or masking
- Require data classification comments on types/interfaces that hold sensitive data

### Audit Trail

- All create, update, and delete operations on sensitive data must produce an audit log entry with: who, what, when, and the before/after state
- Audit logs must be append-only and tamper-evident

### Transaction Integrity

- Financial calculations must use appropriate precision — flag floating-point arithmetic (`number`) for currency; require integer cents, `Decimal.js`, or similar
- Require idempotency keys for payment and transfer endpoints

### Immutability

- Configuration objects returned by `ConfigService` must remain frozen — flag any code that attempts to mutate config at runtime
- Flag `Object.assign()`, spread-then-mutate, or direct property assignment on config objects

### Least Privilege

- Services should only access their own config namespaces via `forFeature()` — flag cross-namespace config access
- Database connections should use role-specific credentials, not root/admin accounts
