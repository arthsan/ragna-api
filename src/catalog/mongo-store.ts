import type { Db } from 'mongodb';
import type { ImportStore } from './importer.ts';
import type { CatalogRecord, Manifest, Era, Resource } from './contract.ts';
export type StoredManifest = Manifest & { _id: string; state: 'loading' | 'ready' };
export type StoredRecord = { _id: string; datasetKey: string; record: CatalogRecord };
export type ActiveDataset = { _id: string; datasetKey: string; sha256: string; reviewed: true };
export const PUBLIC_DATABASE = 'ragna-catalog';
export function createMongoImportStore(db: Db): ImportStore {
  if (!/^ragna_catalog_test_[a-z0-9_]+$/.test(db.databaseName)) throw new Error('Importer only accepts a dedicated test database');
  const manifests = db.collection<StoredManifest>('catalog_datasets');
  const records = db.collection<StoredRecord>('catalog_records');
  return {
    async reserve(manifest) {
      // Atomic insert-only metadata; a conflicting revision can never replace an existing snapshot.
      await manifests.updateOne({ _id: manifest.key }, { $setOnInsert: { ...manifest, state: 'loading' } }, { upsert: true });
      const saved = await manifests.findOne({ _id: manifest.key });
      if (saved?.sha256 !== manifest.sha256) throw new Error('Dataset ID already has different content; use a new datasetId');
    },
    async putRecords(manifest, batch) {
      await records.bulkWrite(batch.map(record => ({ updateOne: {
        filter: { _id: `${manifest.key}/${record.id}` },
        update: { $setOnInsert: { datasetKey: manifest.key, record } }, upsert: true,
      } })), { ordered: true });
    },
    countRecords: key => records.countDocuments({ datasetKey: key }),
    async complete(manifest) {
      await manifests.updateOne({ _id: manifest.key, sha256: manifest.sha256 }, { $set: { state: 'ready' } });
    },
  };
}
export function createMongoReader(db: Db) {
  return async (era: Era, resource: Resource, id: number | string) => {
    const active = await db.collection<ActiveDataset>('catalog_active').findOne({ _id: `${era}/${resource}`, reviewed: true });
    if (!active) return { available: false as const };
    const manifest = await db.collection<StoredManifest>('catalog_datasets').findOne({ _id: active.datasetKey, state: 'ready', era, resource, sha256: active.sha256, synthetic: false });
    if (!manifest) return { available: false as const };
    const saved = await db.collection<StoredRecord>('catalog_records').findOne({ _id: `${manifest.key}/${id}`, datasetKey: manifest.key });
    const { _id: _manifestId, state: _state, ...metadata } = manifest;
    return { available: true as const, metadata, data: saved?.record ?? null };
  };
}
