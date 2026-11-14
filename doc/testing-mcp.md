# MCP validation record — 2026-11-14

## Scope and environment

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

## Passed

- Final verification: 40 Node tests passed, 0 failures, 0 skipped. This includes
  the independent review corrections and rejection of invalid upstream UTF-8 JSON
  rather than silent replacement of bytes.
- `git diff --cached --check`: passed.
- Real MCP subprocess: initialization, tool discovery and successful item/monster
  calls through HTTP loopback fixtures; only expected GET paths were requested.
- Real HTTP redirect blocked; no second URL reached.
- All five implemented route combinations, synthetic records only.
- Bounds, sanitized failures, strict argument validation, framing and backpressure.

## Failed command attempts (environment)

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

## Not executed

- Actual TypeScript, ESLint and Next build analysis, because their commands
  stopped before reaching those tools as described above.
- Official MCP SDK/third-party client interoperability; only synthetic protocol
  fixtures and actual local Node subprocess/HTTP integration were exercised.
- Production data/API/database checks, credential exposure assessment, browser/UI
  checks, and deployment. They are outside this increment.

## Review and limits

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
