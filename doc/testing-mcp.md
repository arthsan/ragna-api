# MCP validation record — 2026-11-14

## Current status: main synchronization after PR #6 merged

PR #6 merged into main on 2026-11-14 at 19:32:41 UTC. Main commit
`b37ffaa8be2e3fcddf0569601de12a6b70edd08a` is incorporated into the existing MCP
branch from head `c7bd2a3dfc7a6e9f12bbf5ba1000c9c2e61f4268`, without force-push.
The only merge conflict was the two new entries at the beginning of
`doc/decisions.md`; both entries were retained.

The main branch's `next.config.js`, `tests/server-env.test.cjs` and
`doc/testing-server-env.md` are retained byte-for-byte. The MongoDB service and
MCP implementation/test source are unchanged by the resolution. PR #8's Node
work remains separate; there is no Node or dependency upgrade in this sync.

Post-synchronization checks on the resolved tree, in the same isolated Node
22.23.4 container setup documented below:

- **Passed:** 40/40 MCP tests and both non-build MongoDB regression tests. The
  combined run reports 43 tests, 42 passed, zero failed and one skipped.
- **Skipped:** the optional built-browser-asset sentinel scan. It requires a
  fresh build and `CHECK_BUILT_ENV=1`; no browser build exists in this Windows
  checkout, so that scan was not represented as passed.
- **Passed:** comparisons against main for the three MongoDB fix artifacts;
  comparisons against the previous MCP head for `mcp`, `src`, MCP tests,
  `package.json`, `yarn.lock` and `tsconfig.mcp.json`; and whitespace checking
  of the PR diff against current main. No unresolved conflict entries remain.
- **Passed:** an independent read-only review confirmed both decision entries,
  preservation of the main fix and prior MCP source, and the documentation's
  distinction between the new tests, the skipped scan and historical checks.
- **Not rerun here:** build, application/MCP typechecks, focused ESLint and the
  independent Python SDK client on the synchronized tree. Their tools remain
  absent from this inspected Windows environment. No dependency was installed.
  The coordinating cloud environment can revalidate the published merge using
  its existing toolchain, including the post-build scan.

Command used for the combined tests:

```sh
node --test --test-timeout=20000 tests/mcp-api.test.mjs tests/mcp-protocol.test.mjs tests/server-env.test.cjs
```

Earlier cloud results in the next section apply to their explicitly named head;
they are not claimed as a new build/typecheck/client run or preview verification
for this synchronization.

The owner had already marked PR #7 ready for review. This synchronization does
not change that state or authorize merging the PR into main or deploying it.

## Earlier cloud verification before main synchronization

The coordinating agent verified head
`53b8f6948d03602629d655e7a4659e3919c04c04` in a separate cloud sandbox using
TypeScript **5.9.3**, Next.js **16.1.1** and the official Python MCP SDK
**1.29.0**, all already installed before these checks. TypeScript/Next had been
used for PR #6. No dependencies were installed for this verification.

The 56 inherited files under the source/public/configuration/lock scope were
checked against their GitHub blob SHAs. Normalization removed only an extra
trailing newline introduced by the materializer. MCP implementation files,
tests, `package.json`, `tsconfig.mcp.json` and `next.config.js` came from the
verified head. The following checks were rerun after that normalization:

| Check | Cloud result |
| --- | --- |
| MCP strict JSDoc typecheck (`tsconfig.mcp.json`) | Passed, exit 0, TypeScript 5.9.3 |
| Application `tsc --noEmit --incremental false` | Passed, exit 0 |
| MCP test suite | Passed, 40/40, zero skips |
| `next build` | Passed, exit 0, Next 16.1.1, sanitized environment and only a fictitious `MONGODB` sentinel |
| Existing `next lint` script | Failed: `Invalid project directory .../lint`; this command was removed in Next 16 |
| Focused ESLint analysis of `mcp tests` | Passed, exit 0, ESLint 9.39.2 and eslint-config-next 16.1.1 under an experimental flat config in the sandbox |
| ESLint analysis of `src mcp tests` under that config | Failed: four pre-existing source errors and seven warnings; details below |
| Official Python SDK client over stdio | Passed, exit 0, SDK `mcp` 1.29.0; details below |

No production application or database was accessed. These are sandbox results,
not production-data, source-license or dataset-coverage validation. This update
changes documentation only; implementation and test contents remain unchanged.

The independent interoperability check used the official SDK's `ClientSession`
and `stdio_client` against `mcp/server.mjs` from that head, with an HTTP loopback
fixture containing synthetic records. It verified:

- Protocol negotiation to `2025-11-25`, initialization, discovery of exactly two
  tools and `ping`.
- `ragna_get_item` with `old-times`/1001 and `ragna_get_monster` with
  `re-newal`/1001.
- An invalid `re-start` item request returning `isError` and a clean disconnect.
- Exactly two GETs reaching the fixture:
  `/api/v1/old-times/items/1001` and
  `/api/v1/re-newal/monsters/1001`.

This establishes compatibility with that SDK version and those flows, not all
MCP clients or optional protocol features. The independent test script remained
in the cloud sandbox; it was not added to the repository's automated suite.

The focused lint check used a sandbox-only `qa-eslint.config.mjs` built with
`defineConfig([...nextVitals, globalIgnores([...])])`, where `nextVitals` is
`eslint-config-next/core-web-vitals` and the global ignores are `.next/**`,
`out/**`, `build/**` and `next-env.d.ts`:

```sh
eslint --config qa-eslint.config.mjs mcp tests
```

The same configuration applied to `src mcp tests` found four errors inherited
from the existing application: two internal anchor links in `Main` pointing to
documentation/about, one internal anchor link in `about`, and synchronous
`set_window(window)` inside the `SearchBar` effect. Seven warnings included
image usage in `about`, a MongoDB ESLint-disable directive and a fixture's
default export. This is a real lint failure, distinct from the obsolete command
failure. No rules were disabled and no repository application or configuration
file was changed. The sandbox experiment demonstrates that the existing lint dependency
versions can run the MCP checks; it does not make the repository-wide lint green.

GitHub's Vercel status was confirmed as `success` for head `53b8f694...`.
Detailed preview logs could not be audited because team access returned HTTP
403. The Vercel status is separate from the explicit sandbox checks above and
does not establish that Vercel ran the MCP typecheck or independent client test.

**Remaining work:** migrate the obsolete lint command and legacy configuration,
then address the inherited application lint findings in a separate quality PR
without disabling rules. General lint remains failed; focused MCP lint passed.
Broader MCP-client compatibility and dataset origin/license/version/coverage
remain unverified. Preview log review remains unavailable.
The PR remains draft; no merge or manual deployment was performed.

## Windows validation history

The records below describe the earlier Windows checkout and its clean Node
container. Their missing-tool observations remain valid for those inspected
environments; their compiler/build/client gaps were subsequently resolved by the
specific cloud checks above. General application lint still fails. They do not
claim that the dependencies were absent from every environment.

## Scope and Windows environment

Source base: `main` at `625dadb4a8faab85389231b50ad193f33b5e3df8`.
The isolated checkout was clean before the feature branch was created.
The only existing open PR was draft #6; its MongoDB fix remains separate.
No applicable `AGENTS.md` or repository `.agents/skills` directory was present.
Engineering rules came from `doc/guideline.md`.

The existing local `node:22-alpine` image (SHA-256
`fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914`)
uses Node 22.23.4. Tests run in a new
disposable container with no external network, an empty environment plus explicit
safe variables, a read-only source mount and root filesystem, no host home or
credentials, a private 256 MiB scratch tmpfs, user 1000, dropped capabilities,
one CPU, 512 MiB RAM, 64 processes, file-size/CPU limits and a 45-second deadline.
Loopback fixtures exist only inside that container. No existing services are used.

## Earlier Windows checks passed

- Final verification: 40 Node tests passed, 0 failures, 0 skipped. This includes
  the independent review corrections and rejection of invalid upstream UTF-8 JSON
  rather than silent replacement of bytes.
- `git diff --cached --check`: passed.
- Real MCP subprocess: initialization, tool discovery and successful item/monster
  calls through HTTP loopback fixtures; only expected GET paths were requested.
- Real HTTP redirect blocked; no second URL reached.
- All five implemented route combinations, synthetic records only.
- Bounds, sanitized failures, strict argument validation, framing and backpressure.

## Earlier Windows command failures (environment)

All four commands were attempted in a disposable scratch copy with external
network disabled. A fictitious `MONGODB` sentinel was supplied; no database was
contacted. The required `node_modules` are not available in this checkout or the
clean Node image:

| Command | Observed result |
| --- | --- |
| `npm run typecheck:mcp` | `tsc: not found` |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | `MODULE_NOT_FOUND` for TypeScript |
| `npm run lint` | `next: not found` |
| `npm run build` | `next: not found` |

These are missing-tool failures, not successful checks or demonstrated code
failures. No dependency was installed or downloaded. The focused security skill
requires already available dependencies and forbids letting builds fetch them.
The recorded failing commands need rerunning in a prepared environment.

The repository's existing lint command is `next lint`; modern Next 16 removed
that command ([official Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16#next-lint-command)).
The missing executable prevented observing that next-stage failure here. Lint
tooling migration is separate from this MCP increment.

## Checks not executed in the Windows environment

- Actual TypeScript, ESLint and Next build analysis, because their commands
  stopped before reaching those tools as described above.
- Official MCP SDK/third-party client interoperability; only synthetic protocol
  fixtures and actual local Node subprocess/HTTP integration were exercised.
- Production data/API/database checks, credential exposure assessment, browser/UI
  checks, and deployment. They are outside this increment.

## Source review and limits at the Windows stage

- `security-audit` used in focused guidance mode: reviewed URL/input boundaries,
  read-only effects, timeout/body limits, error disclosure and untrusted record data.
- Impeccable 4.8.2 instructions read. It excludes backend-only work, so no launcher,
  UI edit or UI playbook was needed. No desktop/mobile visual checks apply here.
- Independent source review identified two issues: an inferred `Map<string,
  string>` needed the resource union type, and errors with unknown request IDs
  must omit the ID rather than use null under the pinned MCP schema. Both were
  corrected, regression assertions added, and reviewed again with no remaining
  source blockers. Static review does not replace the pending compiler check.
- No real API requests, MongoDB connections, credentials, third-party datasets,
  sprites, UI/browser validation, merge, manual deploy or production changes.
- Source/license/version/coverage verification and actual-client compatibility
  remain future work; fixtures cannot establish production data coverage.

## Windows follow-up: existing local tooling and independent client

A second read-only inspection on 2026-11-14 checked whether the outstanding
checks could run without installing dependencies:

- The isolated checkout still has no `node_modules` containing TypeScript, Next,
  ESLint or the official JavaScript MCP SDK.
- The existing `node:22-alpine` image reports Node `v22.23.4`. A new disposable
  container, with no network, reported all four packages absent from its global
  Node package directory. No existing container or service was used.
- No `tsc`, `eslint`, `mcp`, `uv` or `uvx` command was found on the host PATH.
  Inspection of installed global npm tooling and Codex plugin package directories
  found no standalone TypeScript, Next, ESLint, Node type package or
  `@modelcontextprotocol/sdk` package usable in an isolated check.
- Python 3.14 package metadata reports `mcp` is not installed. No Python SDK/client
  code was imported or executed. Installed assistant CLIs were not launched as a
  substitute for an independent MCP SDK test.

Only executable discovery and package-file metadata were inspected. No package
installation, credential/environment-file access, configuration/security change,
existing service, production endpoint or external network from the server was
needed.

Consequently the outstanding checks remain **not executed**:

| Check | Concrete blocker |
| --- | --- |
| MCP strict JSDoc typecheck | TypeScript and Node type definitions are unavailable |
| Application TypeScript check | TypeScript and application dependencies are unavailable |
| ESLint analysis | ESLint/application dependencies are unavailable; the existing `next lint` command also requires migration |
| Next production build locally | Next/application dependencies are unavailable |
| Independent official SDK or third-party MCP client over local stdio | No standalone client/SDK is available in the inspected local toolchains |

The 40 passing tests recorded above apply to implementation commit
`debad695ac1cd3dde113002a4c9022e834fc4476`. This follow-up changes only this validation
record; the implementation and tests are unchanged, so the suite was not repeated.
The documentation diff passes `git diff --cached --check`.

An external preview status is not treated as evidence that the separate
`tsconfig.mcp.json` or independent-client checks ran. Preview logs are being
assessed separately; this local follow-up makes no additional CI/build claim.
The PR remains draft. No merge, readiness transition or manual deployment is
authorized by this record. The next validation needs an already prepared,
compatible dependency/client environment and isolated synthetic fixtures.
