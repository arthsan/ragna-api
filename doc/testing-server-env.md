# MongoDB environment boundary regression

`MONGODB` is a server-only runtime environment variable. Do not add it to
`next.config.js` `env` or give it a `NEXT_PUBLIC_` prefix. The API routes keep
reading it through `src/services/mongodb.ts`. No credential or provider setting
needs changing for this code change.

## Isolated verification

Use a clean checkout with no real `.env*` files or injected credentials. Install
the locked dependencies with Yarn v1. Never run these checks against a real
database. The sentinel below is deliberately fictitious and uses an unusable
local port. Building does not call `getClient()` or start the application.

```sh
node --test tests/server-env.test.cjs
MONGODB='mongodb://127.0.0.1:1/RAGNA_ENV_TEST_SENTINEL_NOT_A_SECRET' NEXT_TELEMETRY_DISABLED=1 yarn build
CHECK_BUILT_ENV=1 node --test tests/server-env.test.cjs
```

The first run checks the config and retained server lookup; the browser-asset
check is skipped until explicitly enabled after a successful build. The second
run scans `.next/static` for the sentinel. It must not print or search for real
credential values. Do not commit generated build artifacts.

This does not prove that an older deployment never exposed a value. Source
inspection found the MongoDB module imported only by API routes, not client
components. Removing the `env` entry removes an unsafe build-time exposure
path without asserting that a leak occurred. Credential investigation or
rotation, if needed, is a separate owner-controlled task.
