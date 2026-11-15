# ADR 0001: immutable catalogs and explicit activation

Date: 2026-11-15. Status: proposed for review; no production data activated.

The existing five routes have undocumented source/era fidelity and read directly
from legacy databases. New source acquisition must not corrupt them or silently
borrow renewal data for restart. The current repository also has no code license
and community sources have distinct permissions and release semantics.

Use a pure strict validator/planner, an import application service, a Mongo
adapter and a shared HTTP handler. Snapshot identity includes era/resource and
an immutable source-specific datasetId, with a content/provenance digest.
Importer metadata and records are insert-only except the loading-to-ready state.
An independent reviewed pointer selects a completed real snapshot. This avoids
requiring multi-document transactions in test/staging and keeps partial imports
unpublished. A crash may leave a loading snapshot; an exact replay resumes it.

A separate public database preserves legacy collection ownership. The included
writer deliberately supports test database names and loopback only. A production
promotion tool needs a separate implementation and explicit authorization; this
increment cannot publish a catalog by running an import command.

Rejected alternatives: direct writes into existing items collections; aliasing
pre-re/re to restart; serving test fixtures; automatically activating every
successful import. Each obscures a material data-quality or operational boundary.

Tradeoffs: snapshots use more storage, activation needs orchestration and an
explicit review, source metadata is only structurally verified by code, and
minimal records cannot yet drive a full calculator. Tests cover the boundaries;
real Mongo integration, source adapters and actual data remain pending.

Details: [contract/source review](../data-catalog.md),
[validation](../testing-catalog.md), [decision log](../decisions.md).
