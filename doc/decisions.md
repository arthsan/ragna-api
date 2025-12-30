# decisions.md

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
