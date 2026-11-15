import { CatalogValidationError, MAX_BYTES, planBundle, type Bundle, type Manifest, type Resource } from './contract.ts';

type Scope = Pick<Bundle, 'era' | 'synthetic'> & { region: string; gameVersion: string };
type Snapshot = { bundle: Bundle; manifest: Manifest };
type TargetResource = Extract<Resource, 'maps' | 'items'>;
export type IntegrityDiagnostic = {
  severity: 'error' | 'warning';
  code: 'INVALID_REFERENCE' | 'INVALID_BUNDLE' | 'TARGET_NOT_SUPPLIED' | 'AMBIGUOUS_TARGET' | 'NOT_OBSERVED_IN_PARTIAL' | 'SNAPSHOT_CONFLICT';
  bundleIndex: number;
  field?: string;
  vendorId?: number | string;
  targetResource?: TargetResource;
  targetId?: number | string;
  candidates?: string[];
};
export type IntegrityReport = {
  structurallyValid: boolean;
  activationReady: false;
  errors: number;
  warnings: number;
  references: { resolved: number; unverified: number };
  snapshots: (Scope & Pick<Manifest, 'key' | 'sha256' | 'recordCount' | 'resource' | 'coverage'>)[];
  diagnostics: IntegrityDiagnostic[];
  omittedDiagnostics: number;
};
function scope(bundle: Bundle): Scope {
  return { era: bundle.era, synthetic: bundle.synthetic, region: bundle.provenance.region, gameVersion: bundle.provenance.gameVersion };
}
function scopeKey(bundle: Bundle): string { return JSON.stringify(scope(bundle)); }

// Findings describe supplied snapshots only; absence in a partial catalog is never a broken-link error.
export function inspectCatalogIntegrity(inputs: unknown[]): IntegrityReport {
  if (!inputs.length || inputs.length > 12 || Buffer.byteLength(JSON.stringify(inputs)) > MAX_BYTES) {
    throw new CatalogValidationError('integrity input limits (1-12 bundles, 20 MiB total)');
  }
  const diagnostics: IntegrityDiagnostic[] = [];
  let errors = 0;
  let warnings = 0;
  let omittedDiagnostics = 0;
  const diagnose = (entry: IntegrityDiagnostic) => {
    if (entry.severity === 'error') errors++; else warnings++;
    if (diagnostics.length < 1000) diagnostics.push(entry); else omittedDiagnostics++;
  };
  const snapshots: (Snapshot & { index: number })[] = [];
  const identities = new Map<string, string>();
  inputs.forEach((input, index) => {
    try {
      const planned = planBundle(input);
      const prior = identities.get(planned.manifest.key);
      if (prior && prior !== planned.manifest.sha256) {
        diagnose({ severity: 'error', code: 'SNAPSHOT_CONFLICT', bundleIndex: index, candidates: [planned.manifest.key] });
      } else if (!prior) {
        identities.set(planned.manifest.key, planned.manifest.sha256);
        snapshots.push({ ...planned, index });
      }
    }
    catch (error) {
      if (!(error instanceof CatalogValidationError)) throw error;
      diagnose({ severity: 'error', code: ['mapId', 'itemId'].includes(error.label) ? 'INVALID_REFERENCE' : 'INVALID_BUNDLE', bundleIndex: index, field: error.label });
    }
  });
  const targets = new Map<string, (Snapshot & { ids: Set<number | string> })[]>();
  for (const snapshot of snapshots) {
    const key = `${scopeKey(snapshot.bundle)}/${snapshot.bundle.resource}`;
    const entries = targets.get(key) ?? [];
    entries.push({ ...snapshot, ids: new Set(snapshot.bundle.records.map(row => row.id)) });
    targets.set(key, entries);
  }
  let resolved = 0;
  let unverified = 0;
  for (const { bundle, index } of snapshots) {
    if (bundle.resource !== 'vendors') continue;
    const inspect = (vendorId: string | number, targetResource: TargetResource, targetId: string | number) => {
      const entries = targets.get(`${scopeKey(bundle)}/${targetResource}`) ?? [];
      if (entries.length === 1 && entries[0].ids.has(targetId)) { resolved++; return; }
      unverified++;
      const code = !entries.length ? 'TARGET_NOT_SUPPLIED' : entries.length > 1 ? 'AMBIGUOUS_TARGET' : 'NOT_OBSERVED_IN_PARTIAL';
      diagnose({ severity: 'warning', code, bundleIndex: index, vendorId, targetResource, targetId, candidates: entries.map(entry => entry.manifest.key) });
    };
    for (const vendor of bundle.records) {
      // validateBundle above established these fields; malformed references never reach this phase.
      inspect(vendor.id, 'maps', vendor.mapId!);
      for (const item of vendor.items!) inspect(vendor.id, 'items', item.itemId);
    }
  }
  return {
    structurallyValid: errors === 0, activationReady: false, errors,
    warnings, references: { resolved, unverified },
    snapshots: snapshots.map(({ bundle, manifest }) => ({ ...scope(bundle), key: manifest.key, sha256: manifest.sha256, recordCount: manifest.recordCount, resource: manifest.resource, coverage: manifest.coverage })),
    diagnostics, omittedDiagnostics,
  };
}
