import { createHash } from 'node:crypto';

export const ERAS = ['old-times', 're-newal', 're-start'] as const;
export const RESOURCES = ['skills', 'maps', 'vendors', 'items'] as const;
export type Era = typeof ERAS[number];
export type Resource = typeof RESOURCES[number];
export type CatalogRecord = {
  id: number | string;
  name: string;
  maxLevel?: number;
  mapId?: string;
  x?: number;
  y?: number;
  items?: { itemId: number; priceZeny: number | null }[];
};
export type Provenance = {
  sourceUrl: string; revision: string; retrievedAt: string;
  region: string; gameVersion: string; eraEvidenceUrl: string;
  licenseId: string; licenseUrl: string; permissionEvidenceUrl: string; attribution: string;
};
export type Bundle = {
  schemaVersion: 1; era: Era; resource: Resource; datasetId: string;
  synthetic: boolean; coverage: 'partial'; provenance: Provenance; records: CatalogRecord[];
};
export type Manifest = Omit<Bundle, 'records'> & { key: string; sha256: string; recordCount: number };
export const MAX_BYTES = 20 * 1024 * 1024;
const MAX_RECORDS = 50000;
const MAP_ID = /^[a-z0-9_@-]{1,64}$/;
const VENDOR_ID = /^[a-z0-9_@:-]{1,120}$/;

function fail(label: string): never { throw new Error(`Invalid catalog: ${label}`); }
function object(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label);
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !keys.includes(key))) fail(`${label} has unknown fields`);
  return result;
}
function text(value: unknown, label: string, max = 1000): string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > max || /[\x00-\x1f]/.test(value)) fail(label);
  return value;
}
function integer(value: unknown, label: string, min: number, max = 2147483647): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) fail(label);
  return value;
}
function url(value: unknown, label: string): string {
  const input = text(value, label, 2000);
  let parsed: URL;
  try { parsed = new URL(input); } catch { return fail(label); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail(label);
  return input;
}
export function isEra(value: unknown): value is Era { return ERAS.some(era => era === value); }
export function isResource(value: unknown): value is Resource { return RESOURCES.some(resource => resource === value); }
export function parseId(resource: Resource, value: unknown): number | string | null {
  if (typeof value !== 'string') return null;
  if (resource === 'maps' || resource === 'vendors') return (resource === 'maps' ? MAP_ID : VENDOR_ID).test(value) ? value : null;
  if (!/^[1-9][0-9]{0,9}$/.test(value)) return null;
  const id = Number(value);
  return id <= 2147483647 ? id : null;
}
function record(resource: Resource, value: unknown): CatalogRecord {
  const extra = resource === 'skills' ? ['maxLevel'] : resource === 'vendors' ? ['mapId', 'x', 'y', 'items'] : [];
  const row = object(value, ['id', 'name', ...extra], 'record');
  const id = resource === 'maps' || resource === 'vendors'
    ? parseId(resource, row.id) : integer(row.id, 'id', 1);
  if (id === null) fail('id');
  const result: CatalogRecord = { id, name: text(row.name, 'name', 200) };
  if (resource === 'skills') result.maxLevel = integer(row.maxLevel, 'maxLevel', 1, 1000);
  if (resource === 'vendors') {
    if (typeof row.mapId !== 'string' || !MAP_ID.test(row.mapId)) fail('mapId');
    result.mapId = row.mapId;
    result.x = integer(row.x, 'x', 0, 65535);
    result.y = integer(row.y, 'y', 0, 65535);
    if (!Array.isArray(row.items) || row.items.length > 1000) fail('vendor items');
    const seen = new Set<number>();
    result.items = row.items.map(value => {
      const entry = object(value, ['itemId', 'priceZeny'], 'vendor item');
      const itemId = integer(entry.itemId, 'itemId', 1);
      if (seen.has(itemId)) fail('duplicate vendor item');
      seen.add(itemId);
      return { itemId, priceZeny: entry.priceZeny === null ? null : integer(entry.priceZeny, 'priceZeny', 0) };
    });
  }
  return result;
}
export function validateBundle(value: unknown): Bundle {
  const data = object(value, ['schemaVersion', 'era', 'resource', 'datasetId', 'synthetic', 'coverage', 'provenance', 'records'], 'bundle');
  if (data.schemaVersion !== 1 || !isEra(data.era) || !isResource(data.resource)) fail('version/era/resource');
  const datasetId = text(data.datasetId, 'datasetId', 80);
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(datasetId)) fail('datasetId');
  if (typeof data.synthetic !== 'boolean' || data.coverage !== 'partial') fail('synthetic/coverage');
  const fields = ['sourceUrl', 'revision', 'retrievedAt', 'region', 'gameVersion', 'eraEvidenceUrl', 'licenseId', 'licenseUrl', 'permissionEvidenceUrl', 'attribution'];
  const p = object(data.provenance, fields, 'provenance');
  const retrievedAt = text(p.retrievedAt, 'retrievedAt');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(retrievedAt) || !Number.isFinite(Date.parse(retrievedAt)) || new Date(retrievedAt).toISOString() !== retrievedAt) fail('retrievedAt');
  const provenance: Provenance = {
    sourceUrl: url(p.sourceUrl, 'sourceUrl'), revision: text(p.revision, 'revision'), retrievedAt,
    region: text(p.region, 'region'), gameVersion: text(p.gameVersion, 'gameVersion'),
    eraEvidenceUrl: url(p.eraEvidenceUrl, 'eraEvidenceUrl'), licenseId: text(p.licenseId, 'licenseId'),
    licenseUrl: url(p.licenseUrl, 'licenseUrl'), permissionEvidenceUrl: url(p.permissionEvidenceUrl, 'permissionEvidenceUrl'),
    attribution: text(p.attribution, 'attribution'),
  };
  if (!Array.isArray(data.records) || !data.records.length || data.records.length > MAX_RECORDS) fail('records count');
  const resource = data.resource;
  const records = data.records.map(value => record(resource, value));
  if (new Set(records.map(row => row.id)).size !== records.length) fail('duplicate id');
  records.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en'));
  return { schemaVersion: 1, era: data.era, resource, datasetId, synthetic: data.synthetic, coverage: 'partial', provenance, records };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).sort().map(key => `${JSON.stringify(key)}:${canonical(row[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
export function planBundle(input: unknown): { bundle: Bundle; manifest: Manifest } {
  if (Buffer.byteLength(JSON.stringify(input)) > MAX_BYTES) fail('bundle exceeds 20 MiB');
  const bundle = validateBundle(input);
  const { records, ...metadata } = bundle;
  return { bundle, manifest: { ...metadata, key: `${bundle.era}/${bundle.resource}/${bundle.datasetId}`,
    sha256: createHash('sha256').update(canonical(bundle)).digest('hex'), recordCount: records.length } };
}
