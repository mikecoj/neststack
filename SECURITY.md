# Security Policy

## Supported Versions

| Version  | Supported |
| -------- | --------- |
| Latest   | Yes       |
| < Latest | No        |

Only the latest released version of each `@nestx/*` package receives security updates. We recommend always upgrading to the latest version.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in any `@nestx/*` package, please report it responsibly:

1. **GitHub Security Advisories (preferred)**: Use the [Security tab](../../security/advisories/new) to create a private security advisory.

2. **Email**: Send details to the repository maintainers via the email listed in their GitHub profile.

### What to include

- A description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Suggested fix (if any)

### What to expect

- **Acknowledgment** within 48 hours
- **Assessment** within 7 days
- **Fix or mitigation** within 30 days for confirmed vulnerabilities
- Credit in the security advisory (unless you prefer to remain anonymous)

## Security Practices

This project follows security best practices for enterprise and banking applications:

- **Dependency auditing**: All PRs are scanned for known vulnerabilities via `pnpm audit` and GitHub's Dependency Review action
- **Static analysis**: CodeQL scans run on every push to `main` and weekly
- **npm provenance**: Published packages include cryptographic provenance attestations
- **Immutable configuration**: Runtime configuration is deep-frozen to prevent tampering
- **Secret masking**: Sensitive values are automatically masked in all log output
- **Minimal permissions**: CI/CD workflows use least-privilege permissions
- **Frozen lockfile**: CI builds use `--frozen-lockfile` to ensure reproducible installs
- **License compliance**: PRs introducing GPL or AGPL dependencies are blocked

## Disclosure Policy

We follow [coordinated vulnerability disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). We ask that you:

- Allow us reasonable time to address the issue before public disclosure
- Make a good-faith effort to avoid privacy violations, data destruction, and service disruption
- Do not exploit the vulnerability beyond what is necessary to demonstrate it
