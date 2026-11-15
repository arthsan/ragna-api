# decisions.md

## 2026-11-15 - Stage versioned catalogs separately from legacy data

- Context: Skills, maps, vendors and re-start items are advertised/planned but absent in main at 5a070377. The repository contains examples, not a reproducible importer or verified era/source mapping. PR #8 owns runtime/lint work and remains separate.
- Decision: Introduce validated, immutable partial snapshots with explicit era, region, game version, source revision, permission/era evidence, attribution and SHA-256. Add ten lookup combinations backed by a separate `ragna-catalog` database, gated by reviewed active pointers. Synthetic snapshots cannot be served. Restrict the included writer to named loopback test databases, with dry-run by default and insert-only records. Do not activate datasets or copy legacy collections.
- Alternatives: Scrape first (source permission/era evidence missing); map rAthena pre-re/re to the API eras automatically (unsupported equivalence); reuse legacy collections (unverified schema/provenance and overwrite risk); add MCP tools immediately (would advertise unavailable datasets).
- Consequences: New routes intentionally return 503 until approved source acquisition and a separately authorized promotion tool/run. Current source research and fixtures establish engineering behavior, not game coverage. No dependencies or runtime selectors change. TypeScript import extensions allow the same domain modules to run in Node 22.18+/24+ tests and Next without transpiler dependencies. Existing app/MCP contracts remain unchanged.
- Validation and next increments: [data-catalog.md](data-catalog.md), [testing-catalog.md](testing-catalog.md), [ADR](adr/0001-versioned-catalogs.md).

## 2026-11-14 - Synchronize the MCP branch after the MongoDB fix merged

- Context: Main advanced to `b37ffaa8be2e3fcddf0569601de12a6b70edd08a` by merging PR #6. Both PRs had prepended entries to this decision log, causing the MCP PR #7 to conflict.
- Decision: Merge that main commit into `feat/mcp-read-only-stdio-20261114` without rewriting history. Preserve both decision entries, the main branch's server-only MongoDB fix and regression files, and the MCP implementation/contracts. Revalidate the combined source with synthetic inputs.
- Consequences: Only this feature branch is synchronized. PR #7 retains the owner's ready-for-review state. No merge to main, manual deployment, Node/dependency upgrade, or PR #8 change is part of this operation.
- Links: doc/testing-mcp.md; https://github.com/arthsan/ragna-api/pull/6; https://github.com/arthsan/ragna-api/pull/7

## 2026-11-14 - Read-only MCP stdio adapter for existing lookups

- Date: 2026-11-14
- Context: The evolution roadmap starts with MCP tools, then verified/versioned item data, simulator, calculator and UI refinement. Only five v1 lookup routes currently exist; dataset source, completeness and patch alignment are not established.
- Decision: Add an optional Node.js 22+ stdio process with two read-only tools for the existing routes. Separate protocol, HTTP adapter and transport. Use Node built-ins, strict JSDoc typechecking, bounded serial requests, exact era/ID validation, fixed allowed upstream origins, no redirects or retries, and synthetic fixtures.
- Alternatives considered: Add a public HTTP MCP endpoint (larger transport/security surface); query MongoDB directly (credentials and coupling); introduce an SDK (new dependency); expand datasets or UI immediately (unverified sources and too much scope).
- Consequences: No REST, Next.js configuration, database, dataset or UI changes. No dependency on draft PR #6 and no duplicated environment fix. The minimal protocol subset needs actual-client compatibility review before broader adoption. Responses explicitly mark dataset version, source verification and coverage as unknown.
- Links: doc/mcp.md, doc/testing-mcp.md; https://modelcontextprotocol.io/specification/2025-11-25/server/tools

## 2026-11-14 - Keep MongoDB configuration server-only

- Context: `next.config.js` included `MONGODB` in its build-time `env` export,
  although source references to the MongoDB service are limited to API routes.
  This creates an unnecessary client-substitution risk; it is not evidence of
  an actual credential leak.
- Decision: Remove only that export. Retain `process.env.MONGODB` in the server
  service, preserving runtime configuration and API behavior. Add focused config
  regression tests and an optional post-build scan using a fictitious sentinel.
- Alternatives: Rename the variable or rotate credentials. Neither is necessary
  for this code boundary fix; no operational configuration or secrets are read
  or changed.
- Consequences: A future approved deployment requires `MONGODB` available to the
  server runtime, as documented already. Existing deployments are not changed
  by this PR. Build checks must use isolated fictitious configuration.
- Validation: See `doc/testing-server-env.md`; no live database required.

## 2026-01-27 - GA4 gtag.js with manual SPA pageviews and UI events

- Date: 2026-01-27
- Context: Current analytics setup used an old UA ID and relied on automatic pageviews, which can duplicate in a SPA. The project needs GA4 with consistent events for core UI actions.
- Decision: Move to GA4 via gtag.js using NEXT_PUBLIC_GA_ID at runtime, disable automatic pageviews, and send manual page_view events on route changes. Add initial UI events (copy endpoint, outbound link, search submit).
- Alternatives considered: Use Google Tag Manager; keep auto pageviews.
- Consequences: More reliable pageview counts in the SPA and clearer event taxonomy; requires GA4 Measurement ID in runtime env.
- Links: doc/plan-ga4.md

## 2026-01-27 - GA4 Measurement Protocol for API route usage

- Date: 2026-01-27
- Context: Need server-side analytics for API usage across all routes in `src/pages/api/**`.
- Decision: Add a GA4 Measurement Protocol client that sends `api_request` events with route, method, status, latency, resource type, and db. Wrap all API handlers with a shared `withApiAnalytics` helper to keep instrumentation consistent.
- Alternatives considered: Instrument each handler manually; rely only on frontend analytics.
- Consequences: Server-side events are sent on a best-effort basis and require `GA4_API_SECRET` and `NEXT_PUBLIC_GA_ID` at runtime.
- Links: doc/plan-ga4.md

## 2025-12-29 - MongoDB connection singleton and pool configuration

- Date: 2025-12-29
- Context: API routes in Next.js were opening Mongo connections via a shared helper without pool tuning, with limited instrumentation. Alerts indicate connection threshold issues. Dependencies are also outdated (Next 11, MongoDB driver 3.x, React 17).
- Decision: Implement a single MongoClient per process with a cached client promise, add pool configuration and minimal connection instrumentation, and expose a connect-call counter. Keep API routes using a shared db helper and avoid connecting per request.
- Alternatives considered: Create a new client per route; use Mongoose; defer pool tuning.
- Consequences: Reduced connection churn and visibility into connection attempts. A follow-up upgrade is required to move Next and other outdated libs to latest.
- Links: N/A

## 2025-12-29 - OpenSSL legacy provider workaround for Next 11 on Node 24

- Date: 2025-12-29
- Context: Running `yarn dev` on Node.js 24 fails with `ERR_OSSL_EVP_UNSUPPORTED` in webpack (Next 11 + webpack 5). Full upgrade to latest Next/React/mongodb is required but not done yet.
- Decision: Add `NODE_OPTIONS=--openssl-legacy-provider` to `dev`, `build`, and `start` scripts as a temporary workaround, while planning a dependency upgrade.
- Alternatives considered: Downgrade Node to 16/18; upgrade Next immediately.
- Consequences: Development/build works on Node 24, but relies on legacy OpenSSL flags. Requires follow-up upgrade to remove the workaround.
- Links: N/A

## 2025-12-29 - Enable unified topology and new URL parser on MongoDB driver 3.x

- Date: 2025-12-29
- Context: Node 24 emitted deprecation warnings for the legacy SDAM engine when using mongodb driver 3.6. The runtime uses Next.js API routes and direct driver usage.
- Decision: Enable `useUnifiedTopology` and `useNewUrlParser` in the MongoClient options to reduce legacy warnings until the driver is upgraded.
- Alternatives considered: Upgrade mongodb driver immediately.
- Consequences: Fewer deprecation warnings on current runtime; still requires a full driver upgrade to remove legacy code paths.
- Status: Superseded by the dependency upgrade to mongodb 7.x in this same iteration.
- Links: N/A

## 2025-12-29 - Upgrade dependencies to latest and drop legacy OpenSSL flag

- Date: 2025-12-29
- Context: Project dependencies were pinned to older versions (Next 11, React 17, mongodb 3.x, eslint 7). Node 24 was using a legacy OpenSSL flag to run dev builds.
- Decision: Upgrade all dependencies to the latest available versions and remove `NODE_OPTIONS=--openssl-legacy-provider` from scripts.
- Alternatives considered: Incremental upgrades by stack layer; keep legacy flag temporarily.
- Consequences: Possible breaking changes (React 19, Next 16, mongodb 7, eslint 9). Requires validation and potential code adjustments.
- Links: N/A

## 2025-12-29 - Replace JSON viewer dependency and remove unused react-query

- Date: 2025-12-29
- Context: `react-json-view` and `pretty-json-view` have peer deps that stop at React 17, causing warnings under React 19. `react-query` was unused in the codebase.
- Decision: Replace the JSON viewer with a lightweight in-house `JsonViewer` component and remove `react-json-view`, `pretty-json-view`, and `react-query` from dependencies.
- Alternatives considered: Migrate to a newer JSON viewer package; downgrade React.
- Consequences: Eliminates peer dependency warnings and unused deps, but removes advanced JSON viewer features.
- Links: N/A

## 2025-12-29 - Add Vercel Analytics and Speed Insights in app root

- Date: 2025-12-29
- Context: Need to enable Vercel Analytics and Speed Insights across the app.
- Decision: Add `@vercel/analytics` and `@vercel/speed-insights` and render their components in `_app.tsx` so they run on all pages.
- Alternatives considered: Add only on specific pages; defer to later.
- Consequences: Enables global analytics/insights collection; adds two lightweight client components to the app shell.
- Links: N/A

## 2025-12-29 - SEO baseline for Pages Router (metadata, canonical, JSON-LD)

- Date: 2025-12-29
- Context: Public pages lacked unique titles/descriptions, canonical tags, OG/Twitter metadata, JSON-LD, and had a broken `/about` link.
- Decision: Add a reusable SEO component with canonical URLs anchored to `https://ragnapi.com`, include OG/Twitter tags and JSON-LD per page, add minimal favicon/manifest using existing image assets, and create a real `/about` page.
- Alternatives considered: Leave metadata duplicated; rely on default tags.
- Consequences: Improved crawlability and share previews; requires keeping metadata in sync per page.
- Links: N/A

