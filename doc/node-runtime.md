# Node.js 26 LTS adoption

Status: draft; runtime compatibility unverified.

## Inspected baseline

Base: `625dadb4a8faab85389231b50ad193f33b5e3df8` on `main`. Manifest and Yarn lock resolve Next.js 16.1.1 / React 19.2.3 and MongoDB driver 7.x. No Node engine/version file, tracked CI, Dockerfile or Vercel JSON exists in this base. The manifest's pre-existing duplicate Analytics/Speed Insights keys are preserved byte-for-byte; this runtime patch does not clean them up.

Next 16.1.1 declares Node `>=20.9.0` ([tagged upstream manifest](https://github.com/vercel/next.js/blob/v16.1.1/packages/next/package.json)); the complete application still needs validation on Node 26. MongoDB #6 and MCP #7 are independent PRs and are not included or modified. This draft does not certify the MCP code on Node 26.

## Runtime selection

Read-only Vercel project inspection on 2026-11-14 reported the project setting `nodeVersion: 24.x`. This is a configured major, not an observation of a running process. This PR changes only versioned selectors; it does not update that setting directly. The package engine takes precedence for future deployments.

- `.nvmrc` pins local development to Node.js 26.13.1, the LTS release verified on 2026-11-14. With an existing version-manager installation, select it with `nvm use`; this PR does not install or change the machine-wide runtime.
- `package.json#engines.node` selects `26.x` for Vercel builds and Node Functions. Vercel manages the exact minor/patch; the build and Function versions can differ.
- Existing dependencies, scripts and application behavior are retained. Node type declarations remain at their existing versions; changing them requires a separate locked dependency update.
- No Docker configuration is present in this base. No Docker setup or provider-setting change is introduced.

## Verification record — 2026-11-14

Passed: static JSON parsing, Node selector agreement, and comparison of all manifest properties other than `engines.node`. The local verification tool used Node.js 24.18.0; it only read configuration as data and did not execute project code. Source review checked the tracked CI, Docker, runtime and Vercel configuration inventory.

Not executed: dependency installation, application tests, typecheck, lint, build, browser QA, service requests or a deployment. Available runtimes were Node.js 24.18.0, portable 24.22.1 and a local Docker Node 22 image; no prepared Node 26 runtime/dependency environment was found. Local policy forbids dependency installation or build downloads. Passing static checks does not establish Node 26 runtime compatibility.

Keep this change in draft until the project checks below pass under Node 26 in an isolated, prepared environment without dependency downloads or production credentials. Use synthetic service fixtures; preserve the documented sandbox controls. Existing Git/Vercel integration may create a branch preview automatically; this is not production deployment approval.

## Rollback

Before merge, close the draft. After a reviewed merge, revert this PR's commit to restore the previous version selectors; any redeployment is a separate owner-approved release action.

## Sources

- [Node.js LTS download](https://nodejs.org/en/download/): 26.13.1 on 2026-11-14.
- [Node.js 26 on Vercel](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel): generally available since 2026-10-29.
- [Vercel Node.js version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions): package engines override project settings; minor and patch updates are automatic.

## Pending project checks

Under Node 26 with prepared dependencies, run a no-emit TypeScript check, `yarn build`, and API/page smoke tests with synthetic MongoDB and analytics adapters and external requests disabled. The existing `lint` script runs `next lint`, which was removed in Next 16; it cannot be treated as an available working gate. Migrate that tooling in a separate scoped change. No test script is defined in this baseline. The original `yarn.lock` is unchanged.
