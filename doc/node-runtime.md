# Node.js 26 LTS adoption

Status: draft. Cloud typechecks, build, 43 tests and synthetic HTTP/MCP smoke checks passed on Node.js 26.13.1. The inherited lint command fails, and browser interaction remains unverified because Chromium cannot start under the cloud socket restrictions.

## Baseline and synchronization

The original PR was based on main at `625dadb4a8faab85389231b50ad193f33b5e3df8`.
On 2026-11-15, main at `5a07037721aaa4c457700cf7786d191e1f03c25b`
was merged into the existing PR branch at
`15a632b5f82041fb121f6c69ed1bf75a1014aecd`, preserving both parents.
The only conflict was in `doc/decisions.md`; all existing decisions were retained.

Merged PRs #6 and #7 are now inherited from main. The MongoDB server-only fix,
MCP implementation and regression tests are preserved byte-for-byte.
Application source, dependency declarations and `yarn.lock` are unchanged from
main; `package.json` retains main's MCP scripts and adds only `engines.node`.
No applicable `AGENTS.md`, repository `.agents/skills`, tracked CI workflow,
Dockerfile or Vercel JSON was found. Engineering instructions came from
[guideline.md](guideline.md).

The locked stack remains Next.js 16.1.1, React 19.2.3, MongoDB driver 7.0.0 and
TypeScript 5.9.3. Existing duplicate Analytics/Speed Insights manifest keys and
Node type declarations are retained.

## Runtime selection

- `.nvmrc` pins development to Node.js 26.13.1. The official Node download page still identifies it as LTS on 2026-11-15.
- `package.json#engines.node` selects `26.x` for future Vercel builds and Node Functions. Vercel manages minor/patch updates; the build and Function patches can differ.
- Read-only inspection on 2026-11-14 reported the provider setting as `24.x`. This PR changes versioned selectors only; it does not change provider settings or the machine-wide runtime.

## Cloud verification — 2026-11-15

Work used an isolated clone, with runtime/tooling/logs outside the source tree.
The official portable Node 26.13.1 Linux x64 archive matched the SHA-256 in
the official `SHASUMS256.txt`:
`5c063e46bab0fbc1c17cc445d7ff129cbdcd0471be6ed83b6ab864f8143bc864`.
The official Yarn 1.22.22 archive matched its npm registry integrity metadata.
Locked application dependencies were prepared with
`yarn install --offline --frozen-lockfile --ignore-scripts --non-interactive`
using the existing cloud cache. No lock or dependency version changed.

| Check | Result |
| --- | --- |
| Application `tsc --noEmit --incremental false` | **Passed**, exit 0 |
| MCP `tsc -p tsconfig.mcp.json` | **Passed**, exit 0 |
| `yarn build` on Next 16.1.1 | **Passed**, exit 0; all listed pages/API routes built |
| Combined MCP/server-env Node tests with `CHECK_BUILT_ENV=1` | **Passed**, 43/43, zero failures/skips |
| Post-build fictitious MongoDB sentinel scan in `.next/static` | **Passed** |
| Five v1 HTTP routes, synthetic matching/missing IDs and cache headers | **Passed** |
| MongoDB health and cached-client reuse | **Passed** against the adapter; `connectCalls: 1` |
| HTTP `/`, `/about`, `/documentation`, `/sitemap.xml`, unknown page | **Passed**, expected content/status including 404 |
| Official Python MCP SDK 1.29.0 → stdio Node 26 → local Next API → synthetic MongoDB | **Passed**, all five route combinations, initialization/discovery, invalid input, ping and clean disconnect |
| Existing `yarn lint` | **Failed**, exit 1: `next lint` is interpreted as an invalid project directory by Next 16 |
| Chromium UI interaction/hydration/search | **Not run**: browser launch fails at `socket()` with `Operation not permitted`; no UI assertions or screenshots completed |
| Live databases, production API requests, real analytics, manual deployment | **Not run**, outside this validation |

The combined test command was:

```sh
CHECK_BUILT_ENV=1 node --test --test-timeout=20000 tests/mcp-api.test.mjs tests/mcp-protocol.test.mjs tests/server-env.test.cjs
```

Build and runtime processes received an empty environment plus explicit tool paths,
`NEXT_TELEMETRY_DISABLED=1` and only the fictitious value
`mongodb://127.0.0.1:1/RAGNA_ENV_TEST_SENTINEL_NOT_A_SECRET`.
No real `.env` files, analytics IDs/secrets or provider credentials were supplied.

The production build was run as written, without application/configuration edits.
A process preload rejected non-loopback Node socket/fetch connections. For smoke
tests only, it replaced MongoClient connect/query/ping operations with synthetic
records. The homepage's existing hard-coded SSR HTTPS lookup was redirected at
the HTTP adapter boundary to a synthetic loopback fixture. This exercises the
built route handlers and response rendering, not the real MongoDB wire protocol
or a live upstream dataset.

Server and clients ran together in one cloud execution session, sharing loopback;
separate sessions do not share it. Successful final smoke audit: zero attempted
external server connections and one synthetic MongoDB connection.
The initial SSR fixture missed Next's bundled Axios and the guard blocked its
external connection before any request; the adapter was corrected before the
passing run. An attempted network namespace was unavailable
(`NETLINK_ROUTE socket: Operation not permitted`); isolation claims are limited
to the sanitized process environment and Node guard, not an OS network namespace.
Chromium's separate socket restriction was left intact.

## Earlier verification — 2026-11-14

The initial Windows configuration-only checks passed on Node 24.18.0.
Application typechecks, build and runtime checks were not run there because
that environment lacked a prepared Node 26 toolchain and prohibited installations.
Those were historical Windows restrictions, not a claim about cloud permissions.

An automatic Vercel preview for original head `15a632b5...` was READY and its logs
reported Node 26.x and a successful build. That earlier status is not evidence
for the synchronized commit. GitHub checks for the new commit are recorded in
the PR description after the branch update.

## Remaining gates

Keep the PR in draft. Migrate the inherited `next lint`/legacy ESLint configuration
and address the existing lint findings in a separate scoped tooling change.
The earlier [MCP validation](testing-mcp.md) records those application findings;
no lint rule was disabled here. Run browser interaction checks in an authorized
environment where Chromium can start. Synthetic passes do not certify live data
connectivity, dataset provenance or every MCP client. No readiness transition,
merge, auto-merge, manual deploy or production release was performed.

## Rollback

Before merge, close the draft. After a reviewed merge, revert the runtime-selector
changes; any deployment remains a separate release action.

## Official sources

- [Node.js LTS download](https://nodejs.org/en/download/) and [Node 26.13.1 checksums](https://nodejs.org/dist/v26.13.1/SHASUMS256.txt), checked 2026-11-15.
- [Vercel Node.js 26 availability](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel), generally available since 2026-10-29.
- [Vercel Node version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
- [Next 16 removal of next lint](https://nextjs.org/docs/app/guides/upgrading/version-16#next-lint-command).
