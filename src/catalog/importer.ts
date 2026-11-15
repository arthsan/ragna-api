import { planBundle, type CatalogRecord, type Manifest } from './contract.ts';

export interface ImportStore {
  reserve(manifest: Manifest): Promise<void>;
  putRecords(manifest: Manifest, records: CatalogRecord[]): Promise<void>;
  countRecords(key: string): Promise<number>;
  complete(manifest: Manifest): Promise<void>;
}
// Validate the entire snapshot before the first write. Exact replays resume safely.
export async function importBundle(input: unknown, store?: ImportStore) {
  const { bundle, manifest } = planBundle(input);
  if (!store) return { mode: 'dry-run', ...manifest };
  await store.reserve(manifest);
  for (let offset = 0; offset < bundle.records.length; offset += 250) {
    await store.putRecords(manifest, bundle.records.slice(offset, offset + 250));
  }
  if (await store.countRecords(manifest.key) !== manifest.recordCount) throw new Error('Catalog record count mismatch');
  await store.complete(manifest);
  return { mode: 'test-import', ...manifest };
}
