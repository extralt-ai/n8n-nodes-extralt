# Repository Instructions

The public repository of `n8n-nodes-extralt`, the n8n community node package for the Extralt API
v1. It is built with n8n's `@n8n/node-cli` and published to npm.

## Repository

- `npm run check` runs everything CI runs: Prettier, the n8n linter, types, tests and the build.
  Run it before finishing.
- Never commit secrets, tokens or `.env` files. The package publishes through npm Trusted
  Publishing with provenance, which n8n requires; never add registry tokens.
- PR titles follow Conventional Commits; release-please derives versions and the changelog from
  them. Never edit the version, `CHANGELOG.md` or `.release-please-manifest.json` by hand.
- Workflows pin every action to a full commit SHA with its version in a comment, start from
  `permissions: {}` and grant each job only what it needs, never persist checkout credentials, and
  pass untrusted context such as PR titles through `env`. zizmor checks them in CI.

## Nodes

- n8n verifies community nodes only without runtime dependencies: use `n8n-workflow` (a peer
  dependency) and Node.js built-ins, never the `extralt` SDK or other packages.
- The Extralt API is the contract. Use its names for resources, fields and event types, and never
  validate requests client-side beyond what the UI needs; the API is authoritative.
- Fix every `n8n-node lint` finding rather than disabling the rule: the same rules decide whether
  n8n verifies the package.
- Webhook signatures follow Standard Webhooks. The tests use the specification's reference vector,
  which Extralt's signer also matches; keep it.
