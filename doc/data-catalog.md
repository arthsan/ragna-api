# Versioned catalogs: coverage, sources and ingestion

Inspected 2026-11-15 against main `5a07037721aaa4c457700cf7786d191e1f03c25b`.
This increment supplies the import/lookup foundation. **Zero real source records
were ingested or redistributed.** Four authored JSON fixtures contain one record
each (one skill, map, NPC shop and item); they are not Ragnarok data.

## Repository inventory and coverage

No AGENTS.md or repository .agents/skills was present. The workspace .agents
folder was empty. Read doc/guideline.md, setup.md, testing-server-env.md and the
MCP verification record. The recursive main tree and all tracked text were
inspected for importers/scrapers, not only the word “scrap”. No executable source
acquisition/import pipeline or data dump was found. develop has the same five
lookup files; documentation is a separate older branch. PRs #6/#7 are merged;
#8 (runtime/lint, draft, observed head 78255fc1) is outside this branch.

| Resource | old-times baseline | re-newal baseline | re-start baseline | This increment |
| --- | --- | --- | --- | --- |
| Monsters | v1 route | v1 route | v1 route | Unchanged |
| Items | v1 route | v1 route | Mock/advertised URL only | New gated re-start route |
| Skills | Planned | Planned | Planned | New gated route for each era |
| Maps | Planned | Planned | Planned | New gated route for each era |
| Vendors | Planned | Planned | Planned | New gated NPC-shop route for each era |

All baseline live counts, source revisions, region/patch alignment, permissions
and completeness remain **unknown**: no production database or credentials were
accessed. Existing `src/utils/mocks` files are documentation examples and cannot
prove stored coverage. Existing databases are named old-times/re-newal/re-start;
legacy readers query monsters by monster_id and items by id. Documentation calls
re-start European, but supplies no dataset evidence for that claim. This label
has been qualified. Do not equate a URL era to a verified game release.

## Source assessment

These are candidates and references, not acquired catalogs. Observed paths are
not a promise that all entries or historical versions are present.

| Source | Observed material | Era/coverage limit | Permission and decision |
| --- | --- | --- | --- |
| [Gravity kRO library](https://ro.gnjoy.com/guide/runemidgarts/) | Publisher guide links for items, skills, monsters and regions | Current Korean service; does not establish any API era | No bulk export/reuse permission established in this review. Reference only; no harvesting. |
| [iW Database](https://db.irowiki.org/db/) | Community HTML item/monster/map/shop lookups; [maps](https://db.irowiki.org/db/map-info/), [shops](https://db.irowiki.org/db/shop-info/) | Present HTML navigation; no measured enumeration or exact era mapping | No bulk dump/API permission or DB-specific license established. Wiki text license cannot be assumed to license a separate database or images. |
| [iRO Wiki RESTART notice](https://irowiki.org/wiki/Template:RESTART) | Historical iRO RE:Start warning | Warns that other regions can differ; no full catalog | Page footer states GFDL 1.3-or-later unless noted. Attribution/history and applicable scope would need preserving for reused text. No text or images imported. |
| [rAthena pre-re skills](https://github.com/rathena/rathena/blob/master/db/pre-re/skill_db.yml), [re skills](https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml) | Structured YAML, separate emulator modes | Neither mode proves the API's old-times/re-newal era; no restart mode established | File headers declare GPL-3.0-or-later; [repository license](https://github.com/rathena/rathena/blob/master/LICENSE). Reuse must preserve notices and satisfy applicable obligations; no data/code copied. |
| [rAthena re items](https://github.com/rathena/rathena/blob/master/db/re/item_db_usable.yml), [map index](https://github.com/rathena/rathena/blob/master/db/map_index.txt), [shops](https://github.com/rathena/rathena/blob/master/npc/merchants/shops.txt) | YAML items, map identifier registry, town NPC scripts | Item file is only a category; map index includes retained/replaced IDs, not era availability. Shops depend on enabled scripts and server settings | GPL repository; scripts/registry require a scoped source and compatibility review. Never relabel these as official or restart data. |

The iW Database robots URL could not be retrieved through the research tool.
No automated scraping was attempted. Guessed /classic/ and /restart/ paths
returned 404; that establishes only those paths, not absence of archives.
Before any scraper: obtain applicable source permission/rules, identify an
authorized export, pin/cache the revision and checksum, use a descriptive user
agent, obey robots and published limits, default to one request per second and
one concurrent request, at most two bounded retries for transient errors,
honor Retry-After, and stop on denial/challenges. No bypass or unlimited retries.
Prefer a maintainer-provided structured export over HTML scraping.

## New route contract

- GET /api/v1/{old-times|re-newal|re-start}/skills/:id (positive integer)
- GET /api/v1/{old-times|re-newal|re-start}/maps/:id (source map code)
- GET /api/v1/{old-times|re-newal|re-start}/vendors/:id (stable source NPC-shop ID)
- GET /api/v1/re-start/items/:id (positive integer)

Successful response: `{ "data": <normalized record>, "dataset": <manifest> }`.
The manifest includes schemaVersion, era, resource, datasetId, SHA-256,
recordCount, synthetic, coverage and full provenance. No Mongo _id or internal
state is returned. This is a new contract, including re-start/items; the two
existing item endpoints and all monster endpoints retain their old shapes.
The existing MCP tool era list is unchanged and does not advertise these routes.
Next gives path parameters precedence over query-string names; an id query
argument cannot override the path ID. Array-shaped handler arguments are rejected.

| HTTP | Meaning | Cache |
| --- | --- | --- |
| 200 | Found in an explicitly activated reviewed snapshot | CDN 300s, stale 60s |
| 400 INVALID_LOOKUP | Invalid era or ID | no-store |
| 404 RECORD_NOT_FOUND | ID absent from the active partial snapshot; not proof of absence from game | no-store |
| 405 METHOD_NOT_ALLOWED | Only GET supported, Allow: GET | no-store |
| 503 DATASET_UNAVAILABLE | No active reviewed real snapshot, incomplete snapshot or storage unavailable | no-store |

Vendors means NPC shops, inferred from source shop navigation and the original
project's generic Vendors roadmap label; no existing vendor schema fixes a
stronger contract. It excludes player vending, auctions and live prices. Minimal
records: skills `{id,name,maxLevel}`; maps `{id,name}`; vendors
`{id,name,mapId,x,y,items:[{itemId,priceZeny}]}`; items `{id,name}`. Null priceZeny
means unknown, zero means free. Map IDs use [a-z0-9_@-], vendor IDs also allow
colon. Coordinates and numeric IDs are bounded integers. Skills do not yet
model formulas, jobs or per-level behavior; maps do not yet carry images,
spawns/warps/geometry. Vendor/item foreign keys may target an unavailable
catalog. The diagnostic below reports these links without treating partial
coverage as an invalid reference; source-backed resolution remains a review gate.

## Bundle and import contract

See the four explicitly synthetic files under tests/fixtures/catalog.
A bundle is schemaVersion 1, one exact era/resource, immutable datasetId,
boolean synthetic, coverage `partial`, provenance and nonempty records.
Provenance requires sourceUrl, immutable source revision identifier,
retrievedAt (canonical UTC timestamp), region, gameVersion, eraEvidenceUrl,
licenseId, licenseUrl, permissionEvidenceUrl and attribution. URLs must be HTTPS
without credentials. The validator checks structure, not the truth of these
claims: a human source/era/permission review remains mandatory.

Unknown fields, duplicate IDs, operator/traversal IDs, missing evidence fields,
invalid records and unsubstantiated `complete` coverage are rejected before
writes. Limits: 20 MiB input, 50,000 records per snapshot, 1,000 items per shop,
250 records per write batch. Larger source catalogs require a reviewed extension
with streaming validation; do not split snapshots and pretend each is complete.
Records are sorted by the ASCII lexical representation of their IDs and object
keys are sorted for a SHA-256 snapshot digest. This removes runtime/ICU collation
variation before any real dataset is loaded.
Use a new datasetId for changed content or provenance.

Run on Node 22.18+ (native TypeScript stripping), preferably Node 24+; no new
runtime selector or dependency is introduced. Node may emit a harmless module
syntax detection warning for .ts imports in this CommonJS package. Do not change
the app's package type to suppress it.

```sh
# Default: validation + report only; no driver connection, credentials or .env loading
node scripts/catalog-import.mjs tests/fixtures/catalog/skills.json

# Optional only against an independently provisioned disposable loopback test Mongo
node scripts/catalog-import.mjs tests/fixtures/catalog/skills.json \
  --apply-test --database ragna_catalog_test_fixture --port 27017
```

The CLI accepts no URI/host/credentials. It never reads MONGODB. Apply requires
a database matching `ragna_catalog_test_[a-z0-9_]+`, and connects only to
127.0.0.1 with pool size one and two-second connection/selection deadlines.
The adapter independently enforces the database restriction. No real Mongo
write was executed during development; adapter tests use a controlled
in-memory driver-shaped double, not a real Mongo server.

Only new collections catalog_datasets/catalog_records are touched by this
writer. Metadata reserves a dataset key `{era}/{resource}/{datasetId}` with
insert-only upsert; an existing different digest fails. Records have deterministic
_id values and insert-only upserts. Exact replay resumes interrupted batches;
metadata becomes ready only after both the expected count and the SHA-256
recomputed from the stored records and full provenance agree. Existing metadata
is compared in full on replay, and the ready update must be acknowledged. Never delete or
replace old datasets. There is no automatic retry, activation or cleanup.
Partial failures leave loading snapshots that readers cannot select. Concurrent
same-key first imports can encounter a unique-key race; rerun the exact bundle.
Treat stored snapshots as immutable and restrict write permissions accordingly.

Public readers use a separate **ragna-catalog** database and three collections:
catalog_active (reviewed era/resource pointer with dataset key and digest),
catalog_datasets (ready, matching era/resource/digest, synthetic false), and
catalog_records. The reader validates manifest schema/identity, enforces
`pointer.datasetKey == manifest._id == manifest.key`, validates the record count
and digest format, then reads and validates the entire selected snapshot and
recomputes its digest. Truncated/extra/corrupted rows, unsupported metadata and
synthetic-flag changes without a matching digest make the dataset unavailable;
a missing ID becomes 404 only after the supplied snapshot passes verification.
A snapshot can be internally intact while its game coverage remains partial.

Reads close their cursor, stop at recordCount+1 / 20 MiB of record JSON, and set
query maxTimeMS to 5 seconds. Verification runs on every uncached lookup, not on
an unverified cached flag. This costs a full snapshot scan per cache miss and
has not been performance-tested on real catalogs. Before public activation,
provision an index on catalog_records.datasetKey and benchmark approved data;
any future optimization must preserve equivalent integrity checks. Immutable
snapshots and restricted writer access remain required; a digest is not proof
that source or synthetic claims are true, nor a signature against an authorized
writer rewriting data, metadata and the reviewed pointer together.

Importing into a test DB never makes data public. No promotion
writer is included. Public activation is a separate authorized operation after
source/data review; fixtures must never be relabeled or copied into public data.
Rollback for a future release is selecting the previously approved immutable
snapshot, followed by CDN cache expiry (up to 360s); retained legacy data stays
untouched. Actual provider/production changes are outside this PR.

## Diagnose references across supplied bundles

```sh
node scripts/catalog-integrity.mjs tests/fixtures/catalog/vendors.json \
  tests/fixtures/catalog/maps.json tests/fixtures/catalog/items.json
# Equivalent script: yarn catalog:integrity FILE.json ...
```

This is a read-only file diagnostic: no driver, Mongo, credentials, activation or
source download. Supply 1-12 explicit JSON bundles, at most 20 MiB total. The
example resolves the synthetic map reference but warns that no compatible item
catalog was supplied: the item fixture is re-start and the vendor fixture is
old-times. It intentionally does not borrow another era's items.

References resolve only against one supplied target snapshot with the same era,
region, gameVersion and synthetic flag. Source revisions and datasetIds can
vary across resource exports; equal declared scope only establishes identifier
matching, not proven historical/source compatibility. Inspect the snapshots'
reported scope/digest and supporting evidence before any review decision.

| Diagnostic | Meaning | Severity / CLI status |
| --- | --- | --- |
| INVALID_REFERENCE | Malformed vendor mapId or itemId, rejected by bundle validation | Error / exit 1 |
| INVALID_BUNDLE | Other invalid schema, record or provenance | Error / exit 1 |
| SNAPSHOT_CONFLICT | Same immutable snapshot key supplied with different digests | Error / exit 1 |
| NOT_OBSERVED_IN_PARTIAL | Valid reference absent from the compatible partial target | Warning / exit 0 if no errors |
| TARGET_NOT_SUPPLIED | No valid target with matching declared scope | Warning / exit 0 if no errors |
| AMBIGUOUS_TARGET | Multiple target snapshots in the same scope; none selected/unioned automatically | Warning / exit 0 if no errors |

Identical snapshots are deduplicated. Validation reports the first structural
error per invalid bundle and excludes it from reference resolution; this is not
an exhaustive schema-error collector. The report includes all error/warning and
resolved/unverified counts, snapshot keys/digests/scopes, and at most 1,000 detail
entries; omittedDiagnostics counts additional findings. Warnings never block
partial bundles from importing. `activationReady` is always false: even a
structurally valid report with all supplied IDs resolved is not an activation
approval or a claim of complete game coverage. No activation writer is added.

## Concrete remaining increments and safe real-load plan

1. Resolve historical semantics with the original scraper/export or owner:
   region, server, patch/episode and observation date for each API era. Obtain
   counts/source metadata from a separately authorized read-only data inventory.
   Keep re-start unsupported until its own evidence exists.
2. Obtain a permitted source export. For structured emulator data, explicitly
   decide whether emulator semantics fit the intended API; pin a commit and
   preserve applicable notices before building YAML/NPC adapters. Do not infer
   official game coverage from repository mode names. For iW data, confirm DB
   reuse permission and allowed export with maintainers before scraping.
3. Build one source adapter and save the original export checksum, acquisition
   log, attribution/license materials and exact era mapping. Emit normalized
   bundles; dry-run and report parsed/accepted/rejected/duplicate counts by era
   and resource, plus representative manual comparisons. No counts are known yet.
4. Load only a disposable staging database using least-privilege staging
   credentials in a separately authorized runner. Verify repeat imports, actual
   driver behavior, count/hash agreement and source fidelity. Run the implemented
   reference diagnostic on selected era-aligned snapshots and review unresolved
   partial shop/map/item links with source evidence. Add skill/item detail only when sourced and versioned.
5. Prepare a promotion tool as a separate reviewed increment: validate snapshots
   and evidence, forbid synthetic data, copy to new immutable public snapshot
   namespaces without legacy writes, and atomically change reviewed pointers.
   Coordinate exact database, counts, digest, backup/rollback pointer and owner
   approval before any real load/activation. No such operation is authorized here.
6. After real data is active, add MCP capabilities with the new envelope and
   measured coverage. Simulator, calculator and UI work remain later increments.

See [verification and limitations](testing-catalog.md).
