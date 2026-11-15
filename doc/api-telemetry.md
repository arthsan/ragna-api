# Audience and API operations are separate

## Problem and correction

The former GA4 Measurement Protocol sender generated a random `client_id` for
**each** API request and fell back to the website's measurement ID. Request counts
could inflate GA4 total users without reflecting real people or engaged visitors.
Google describes `client_id` as the website's user-instance identifier, not a
request identifier: [Measurement Protocol guidance](https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events).

API calls now emit a JSON `api_request` operational log, not GA4 events. Browser
GA4 code and its events are unchanged. Do not substitute IP hashes, fingerprints,
cookies, or a shared fictitious GA4 user. The server helper makes no network calls,
reads no GA secret and does not write MongoDB. Existing credentials can be retired
separately by the owner after checking other consumers; this PR does not revoke them.

## Payload and privacy

Only event/schema, fixed route family, method, HTTP status, duration, resource and
game version are recorded. No actual URL/query/path ID, search text, request or
response body, headers, token, IP, cookie, UA, email, client ID or request ID is read.
Routes are **labels synthesized from handler metadata**, not raw request paths:
`/api/v1/old-times/items/:id`, `/api/health`, `/api/other`.
Future collection/list routes may share the resource family label, not a literal
router pattern. Unsupported metadata becomes `other`; unsupported methods become
`OTHER`. Durations are nonnegative rounded milliseconds and invalid values become
zero; invalid status becomes zero. Status and latency are measurements, not user
identifiers. No record contains source timestamps; runtime log metadata dates it.

There are at most 17 route families, 8 method labels, 7 resource labels and 4 version
labels. Status is bounded to HTTP 100–599 (or 0). Do not use numeric durations as
high-cardinality dimensions in a future backend; compute distributions instead.

## Useful metrics and limits

Count records for instrumented handler executions, group by version/resource,
calculate status/error rate and latency percentiles over the same period. The wrapper
records once after handler completion, preserving thrown errors as status 500 unless
an error status already exists. Logging failure does not replace the response/error.

This is **not** durable billing-grade metering, end-to-end response timing, unique
API consumers, human traffic, or a growth conversion. CDN hits that bypass the handler,
uninstrumented routes, early platform failures and dropped/expired logs are absent.
Bots and people are deliberately indistinguishable. No analytics dashboard or log
export was provisioned by this PR; log availability and retention depend on hosting.

One small log record per executed request adds storage/ingestion volume. Default is
on to retain operations visibility; `API_TELEMETRY_ENABLED=false` disables it if
volume or privacy policy requires it. No sampling is silently applied. At significant
volume review retention/cost and an aggregate metrics sink before adding a paid log
drain. This change does not change hosting permissions, paid plans or log retention.

## Release and historical reporting

Merge/release remains owner-controlled. Record the actual production cutover time,
not the PR date. Verify an API call produces a normalized runtime record and no
Measurement Protocol request; separately validate browser GA4 events. No production
calls or live GA writes are needed for automated tests.

Historical synthetic users **are not corrected automatically**. Compare audience in
post-cutover periods or event-scoped explorations excluding `api_request`. Excluding
an event in a report is not deletion/reprocessing of GA4 users and may not reconstruct
accurate historical user totals. Annotate the discontinuity; do not claim a collapse
in real traffic. Do not delete historical data as part of this correction.

## Local validation

`node --test tests/api-telemetry.test.cjs tests/mcp-*.test.mjs tests/server-env.test.cjs`

`npx tsc --noEmit --incremental false`, `npx eslint .`, and `npm run build`.

Tests mock the logger, reject network calls, cover status/error handling, hostile
metadata, log-sink failures and opt-out. The request URL/header getters deliberately
throw so accidental reads fail the tests. Runtime and full build results are recorded
in the PR; local tests do not prove production ingestion or provider retention.
