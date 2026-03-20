---
applyTo: ".github/workflows/**"
---

# CI/CD Workflow Security Rules

GitHub Actions workflows in this repository must follow enterprise-grade security practices. A compromised workflow can exfiltrate secrets, publish malicious packages, or tamper with releases.

## Action Pinning

- All third-party actions must be pinned to a full commit SHA — never use mutable tags (`@v4`, `@main`, `@latest`)
- First-party GitHub actions (`actions/*`) should also be pinned to SHA for maximum security
- Add a comment with the tag version next to each SHA for readability: `uses: actions/checkout@<sha> # v4.2.0`

## Permissions

- Set `permissions: {}` (empty object) at the workflow level — grant zero permissions by default
- Grant specific permissions per job using the least-privilege principle
- Common grants:
  - `contents: read` for checkout
  - `checks: write` for status checks
  - `id-token: write` for OIDC/npm provenance
  - `packages: write` for publishing
- Never grant `permissions: write-all` or omit the `permissions` key (which defaults to broad access)

## Secrets and Credentials

- Never echo, print, or log secrets — not even masked; avoid `echo ${{ secrets.* }}` in `run:` steps
- Use `environment` protection rules for production deployments
- Prefer OIDC (`id-token: write`) over long-lived secrets for cloud provider authentication
- Rotate secrets regularly — document rotation schedule in the workflow comments

## Trigger Security

- Never use `pull_request_target` with `actions/checkout` that checks out the PR head ref — this allows arbitrary code execution from forks
- If `pull_request_target` is necessary, only check out the base ref and use read-only operations on PR content
- Restrict `workflow_dispatch` to required inputs with validation — no free-form string inputs that end up in shell commands

## Shell Injection Prevention

- Always quote step outputs and GitHub context expressions in shell commands: `"${{ steps.x.outputs.y }}"`
- Never interpolate `${{ github.event.*.body }}`, `${{ github.event.*.title }}`, or any user-controlled field directly in `run:` steps — use environment variables instead:
  ```yaml
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "$PR_TITLE"
  ```
- Use `actions/github-script` for complex logic instead of inline shell with interpolated contexts

## Supply Chain

- Use `--frozen-lockfile` for all install steps — never allow lockfile modifications in CI
- Enable npm provenance (`--provenance`) for all package publish steps
- Pin Node.js versions explicitly — never use `node-version: 'latest'`
- Cache dependencies deterministically using lockfile hashes

## Workflow Modification Controls

- All workflow changes must be reviewed by CODEOWNERS (`.github/` is owned by `@mikecoj`)
- Flag any workflow that modifies its own repository (push commits, create branches) without proper guards
- New workflows must include a comment block explaining their purpose and security considerations
