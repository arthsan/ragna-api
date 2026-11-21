import type { Db } from 'mongodb';
import type { ImportStore } from './importer.ts';
import {
  CatalogValidationError, MAX_BYTES, manifestsEqual, validateManifest, verifySnapshot,
  type CatalogRecord, type Manifest, type Era, type Resource,
} from './contract.ts';
export type StoredManifest = Manifest & { _id: string; state: 'loading' | 'ready' };
export type StoredRecord = { _id: string; datasetKey: string; record: CatalogRecord };
export type ActiveDataset = { _id: string; datasetKey: string; sha256: string; reviewed: true };
export const PUBLIC_DATABASE = 'ragna-catalog';

function storedManifest(value: StoredManifest): Manifest {
  const { _id, state, ...metadata } = value;
  const manifest = validateManifest(metadata);
  if (_id !== manifest.key || !['loading', 'ready'].includes(state)) throw new CatalogValidationError('stored manifest identity/state');
  return manifest;
}
async function readSnapshot(db: Db, manifest: Manifest) {
  const cursor = db.collection<StoredRecord>('catalog_records')
    .find({ datasetKey: manifest.key }).limit(manifest.recordCount + 1).maxTimeMS(5000);
  const records: unknown[] = [];
  let bytes = 0;
  try {
    for await (const row of cursor) {
      if (row.datasetKey !== manifest.key || row._id !== `${manifest.key}/${row.record?.id}`) throw new CatalogValidationError('snapshot record identity');
      const serialized = JSON.stringify(row.record);
      if (typeof serialized !== 'string') throw new CatalogValidationError('snapshot record');
      bytes += Buffer.byteLength(serialized);
      if (bytes > MAX_BYTES || records.length >= manifest.recordCount) throw new CatalogValidationError('snapshot limits/count');
      records.push(row.record);
    }
  } finally { await cursor.close(); }
  return verifySnapshot(manifest, records);
}
export function createMongoImportStore(db: Db): ImportStore {
  if (!/^ragna_catalog_test_[a-z0-9_]+$/.test(db.databaseName)) throw new Error('Importer only accepts a dedicated test database');
  const manifests = db.collection<StoredManifest>('catalog_datasets');
  const records = db.collection<StoredRecord>('catalog_records');
  return {
    async reserve(manifest) {
      await manifests.updateOne({ _id: manifest.key }, { $setOnInsert: { ...manifest, state: 'loading' } }, { upsert: true });
      const saved = await manifests.findOne({ _id: manifest.key });
      if (!saved || !manifestsEqual(storedManifest(saved), manifest)) throw new Error('Dataset ID already has different content; use a new datasetId');
    },
    async putRecords(manifest, batch) {
      await records.bulkWrite(batch.map(record => ({ updateOne: {
        filter: { _id: `${manifest.key}/${record.id}` },
        update: { $setOnInsert: { datasetKey: manifest.key, record } }, upsert: true,
      } })), { ordered: true });
    },
    countRecords: key => records.countDocuments({ datasetKey: key }),
    async complete(manifest) {
      const saved = await manifests.findOne({ _id: manifest.key });
      if (!saved || !manifestsEqual(storedManifest(saved), manifest)) throw new CatalogValidationError('manifest changed before completion');
      // Count alone cannot prove that insert-only upserts retained the expected contents.
      await readSnapshot(db, manifest);
      const result = await manifests.updateOne({ _id: manifest.key, sha256: manifest.sha256 }, { $set: { state: 'ready' } });
      if (result.matchedCount !== 1) throw new CatalogValidationError('manifest changed during completion');
    },
  };
}
export function createMongoReader(db: Db) {
  return async (era: Era, resource: Resource, id: number | string) => {
    try {
      const pointerId = `${era}/${resource}`;
      const active = await db.collection<ActiveDataset>('catalog_active').findOne({ _id: pointerId, reviewed: true });
      if (!active || active._id !== pointerId || active.reviewed !== true || typeof active.datasetKey !== 'string' || !/^[a-f0-9]{64}$/.test(active.sha256)) return { available: false as const };
      const saved = await db.collection<StoredManifest>('catalog_datasets').findOne({ _id: active.datasetKey, state: 'ready', era, resource, sha256: active.sha256, synthetic: false });
      if (!saved) return { available: false as const };
      const manifest = storedManifest(saved);
      if (saved.state !== 'ready' || manifest.synthetic || manifest.era !== era || manifest.resource !== resource || manifest.key !== active.datasetKey || manifest.sha256 !== active.sha256) return { available: false as const };
      const verified = await readSnapshot(db, manifest);
      return { available: true as const, metadata: verified.manifest, data: verified.bundle.records.find(row => row.id === id) ?? null };
    } catch (error) {
      if (error instanceof CatalogValidationError) return { available: false as const };
      throw error;
    }
  };
}
