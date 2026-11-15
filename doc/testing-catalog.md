# Catalog verification — 2026-11-15

Base main: `5a07037721aaa4c457700cf7786d191e1f03c25b`.
Isolated cloud checkout: `ragna-data-20261115`, branch
`feat/versioned-data-pipeline-20261115`. No other checkout or PR #8 was modified.
No repository AGENTS.md was present. Followed doc/guideline.md and retained
the server environment regression contract.

## Final results

| Gate | Result | Scope |
| --- | --- | --- |
| Catalog tests | 45 passed, 0 failed/skipped | Validation/provenance, IDs, dry-run CLI, adapter insert-only replay, 250-record partial failure/resume, count mismatch, database restriction, publication gates and ten handler combinations |
| Combined suite after build | 88 passed, 0 failed/skipped | Catalog + 40 MCP tests + three server environment regressions |
| Strict catalog typecheck | Passed | contract.ts, importer.ts and mongo-store.ts; excludes legacy server module reached by HTTP handler |
| App no-emit typecheck | Passed | Root TypeScript config, including handler and route files; preserves inherited strict:false |
| MCP typecheck | Passed | Existing tsconfig.mcp.json |
| Focused ESLint 9 / Next config | Passed | All new code/tests/routes and changed documentation.tsx; no rules disabled |
| Next 16.1.1 optimized Turbopack build | Passed | Includes three dynamic resource routes plus re-start items; existing routes retained |
| Compiled server HTTP smoke | 20 passed | Ten new combinations (nine fixture successes, one intentionally unactivated 503), five legacy successes, missing record 404, bad era/ID 400, path/query precedence 200 and POST 405 |
| Built browser sentinel scan | Passed | Existing test confirms fictitious Mongo sentinel absent from .next/static |
| Whitespace / baseline preservation | Passed | git diff --check; legacy routes/service, Mongo config, MCP source and lockfile unchanged |
| Existing package lint command | Failed, inherited | next lint is absent in Next 16: Invalid project directory .../lint |
| Whole-source direct ESLint | Failed, inherited | Four errors (internal anchor links in Main/about and synchronous state in SearchBar effect), seven warnings. Those files are unchanged here; PR #8 owns lint migration/fixes |
| Real MongoDB integration | Not run | No mongod/container runtime available in the inspected environment; driver-shaped in-memory double only |
| Real source import or public activation | Not run | No permitted era-aligned export acquired; no secrets/production DB accessed |
| UI/browser QA | Not run | Only a factual documentation paragraph changed; no new frontend workflow |

Environment: Node 24.22.1, TypeScript 5.9.3, Next 16.1.1, MongoDB driver 7.0.0,
ESLint 9.39.2/eslint-config-next 16.1.1. Dependencies were copied from an existing
prepared cloud toolchain into this checkout, without installation or downloads.
The first build attempt used a dependency symlink outside the checkout and
Turbopack rejected its filesystem root. Copying the already installed packages
resolved that environment issue; the final unmodified-source build passed.
No Node selection or repository lint tooling changes are included.

The HTTP harness preloaded a synthetic MongoClient adapter into the compiled
Next process, bound 127.0.0.1 only and blocked external sockets/fetch. Only the
harness simulated reviewed real snapshots to exercise 200s; these objects never
went to a database. Independently, committed tests prove that synthetic:true
snapshots cannot be served. The intentional 503 tests an absent active pointer,
not a failed database. Successes contain explicitly named synthetic records and
example.invalid provenance. Build used a fictitious local Mongo sentinel only,
with a clean environment and no analytics credentials. The harness terminated
the server after checks.

The smoke test also established that Next path parameters take precedence over
same-named query strings; arrays are tested at the handler boundary. This is
platform routing behavior, not a source-data guarantee. No Vercel preview API or
production endpoint was queried for this feature verification.

## Reproduce the committed checks

Use already prepared dependencies and an isolated environment without real
credentials or .env files. Do not install/fetch packages as a side effect of a
build in a restricted environment.

```sh
node --test tests/catalog-*.test.mjs
node node_modules/typescript/bin/tsc -p tsconfig.catalog.json
node node_modules/typescript/bin/tsc -p tsconfig.mcp.json
node node_modules/typescript/bin/tsc --noEmit --incremental false
MONGODB='mongodb://127.0.0.1:1/RAGNA_ENV_TEST_SENTINEL_NOT_A_SECRET' \
  NEXT_TELEMETRY_DISABLED=1 node node_modules/next/dist/bin/next build
CHECK_BUILT_ENV=1 node --test tests/catalog-*.test.mjs tests/mcp-*.test.mjs tests/server-env.test.cjs
```

Focused lint used this checkout-local temporary config with no disabled rules:

```js
import next from 'eslint-config-next/core-web-vitals';
export default [...next];
```

```sh
node node_modules/eslint/bin/eslint.js --config .qa-catalog/eslint.config.mjs \
  src/catalog scripts/catalog-import.mjs tests/catalog-*.test.mjs \
  'src/pages/api/v1/[era]' 'src/pages/api/v1/re-start/items' src/pages/documentation.tsx
```

Local build/smoke logs and harness live in the ignored .qa-catalog directory;
only durable fixtures/tests and this evidence record belong in the PR. The new
CLI requires native [Node TypeScript support](https://nodejs.org/api/typescript.html)
(22.18+ default stripping; this run used 24.22.1). Explicit .ts imports are
[allowed by the TypeScript no-emit option](https://www.typescriptlang.org/tsconfig/allowImportingTsExtensions.html).
This is not a claim of tested compatibility on every Node version.

## Remaining acceptance gates

Keep the PR draft: this is a tested foundation, not delivery of populated
catalogs. Source permission and historical region/patch mapping are unresolved,
no actual source adapter/export has been tested, no real-driver import has been
run, and no production promotion tool exists. Minimal record fields do not yet
cover complete skill calculations/map geometry/item statistics. The explicit
remaining increments and safe load plan are in [data-catalog.md](data-catalog.md).
No merge, manual deployment, production write or provider setting change occurred.
