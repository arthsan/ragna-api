import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { inspectCatalogIntegrity } from '../src/catalog/integrity.ts';

async function inputs() {
  const bundles=await Promise.all(['vendors','maps','items'].map(resource=>readFile(new URL(`./fixtures/catalog/${resource}.json`,import.meta.url),'utf8').then(JSON.parse)));
  for (const bundle of bundles) bundle.era='old-times';
  return bundles;
}
test('resolves vendor map and inventory only in supplied compatible snapshots',async()=>{
  const bundles=await inputs();const before=JSON.stringify(bundles);
  const report=inspectCatalogIntegrity(bundles);
  assert.equal(report.structurallyValid,true);assert.equal(report.activationReady,false);
  assert.deepEqual(report.references,{resolved:2,unverified:0});assert.deepEqual(report.diagnostics,[]);
  assert.equal(report.snapshots.length,3);assert.equal(JSON.stringify(bundles),before);
});
test('absence of target catalogs produces warnings and does not invalidate a partial vendor catalog',async()=>{
  const [vendors]=await inputs();const report=inspectCatalogIntegrity([vendors]);
  assert.equal(report.structurallyValid,true);assert.equal(report.errors,0);assert.equal(report.warnings,2);
  assert.ok(report.diagnostics.every(row=>row.code==='TARGET_NOT_SUPPLIED'));
});
test('well-formed IDs missing from supplied partial catalogs are unverified, never invalid references',async()=>{
  const bundles=await inputs();bundles[1].records[0].id='different_map';bundles[2].records[0].id=900002;
  const report=inspectCatalogIntegrity(bundles);
  assert.equal(report.structurallyValid,true);assert.equal(report.errors,0);assert.equal(report.warnings,2);
  assert.deepEqual(report.references,{resolved:0,unverified:2});
  assert.ok(report.diagnostics.every(row=>row.code==='NOT_OBSERVED_IN_PARTIAL'&&row.severity==='warning'));
});
for (const [label,mutate] of [
  ['era',b=>b.era='re-start'],['region',b=>b.provenance.region='other-region'],
  ['game version',b=>b.provenance.gameVersion='other-patch'],['synthetic status',b=>b.synthetic=false],
]) test(`does not resolve a matching ID across ${label}`,async()=>{
  const bundles=await inputs();mutate(bundles[1]);
  const report=inspectCatalogIntegrity(bundles);
  assert.equal(report.structurallyValid,true);assert.equal(report.references.resolved,1);
  assert.equal(report.diagnostics[0].targetResource,'maps');assert.equal(report.diagnostics[0].code,'TARGET_NOT_SUPPLIED');
});
test('matches independent source revisions and dataset IDs when declared scope agrees',async()=>{
  const bundles=await inputs();bundles[1].datasetId='maps-snapshot';bundles[1].provenance.revision='maps-revision';
  assert.equal(inspectCatalogIntegrity(bundles).references.resolved,2);
});
test('multiple target snapshots are ambiguous rather than silently unioned or marked invalid',async()=>{
  const bundles=await inputs();const second=structuredClone(bundles[1]);second.datasetId='other-maps';second.records[0].id='other_map';
  const report=inspectCatalogIntegrity([...bundles,second]);
  assert.equal(report.structurallyValid,true);assert.equal(report.errors,0);assert.equal(report.warnings,1);
  assert.equal(report.diagnostics[0].code,'AMBIGUOUS_TARGET');assert.equal(report.diagnostics[0].candidates.length,2);
});
test('identical repeated snapshots are deduplicated without spurious ambiguity',async()=>{
  const bundles=await inputs();const report=inspectCatalogIntegrity([...bundles,structuredClone(bundles[1])]);
  assert.equal(report.snapshots.length,3);assert.equal(report.warnings,0);assert.equal(report.references.resolved,2);
});
test('different content under the same immutable snapshot key is an error',async()=>{
  const bundles=await inputs();const conflicting=structuredClone(bundles[1]);conflicting.records[0].name='Different';
  const report=inspectCatalogIntegrity([...bundles,conflicting]);
  assert.equal(report.structurallyValid,false);assert.equal(report.errors,1);assert.equal(report.diagnostics[0].code,'SNAPSHOT_CONFLICT');
});
for (const [label,mutate,field] of [
  ['invalid map code',b=>b.records[0].mapId='../map','mapId'],
  ['string item ID',b=>b.records[0].items[0].itemId='900001','itemId'],
  ['negative item ID',b=>b.records[0].items[0].itemId=-1,'itemId'],
]) test(`classifies ${label} as an invalid reference, even without target catalogs`,async()=>{
  const [vendors]=await inputs();mutate(vendors);
  const report=inspectCatalogIntegrity([vendors]);
  assert.equal(report.structurallyValid,false);assert.equal(report.errors,1);
  assert.equal(report.diagnostics[0].code,'INVALID_REFERENCE');assert.equal(report.diagnostics[0].field,field);
});
test('other malformed bundle data remains distinct from invalid references',async()=>{
  const bundles=await inputs();bundles[1].coverage='complete';
  const report=inspectCatalogIntegrity(bundles);
  assert.equal(report.structurallyValid,false);assert.equal(report.diagnostics[0].code,'INVALID_BUNDLE');
  assert.ok(report.diagnostics.some(row=>row.code==='TARGET_NOT_SUPPLIED'));
});
test('inspection requires bounded explicit inputs',()=>{
  assert.throws(()=>inspectCatalogIntegrity([]),/input limits/);
  assert.throws(()=>inspectCatalogIntegrity(Array(13).fill(null)),/input limits/);
  assert.throws(()=>inspectCatalogIntegrity([{oversized:'x'.repeat(20*1024*1024)}]),/input limits/);
});
test('CLI reports partial warnings with exit zero and invalid references with exit one, without Mongo',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'ragna-catalog-integrity-'));
  try {
    const [vendors]=await inputs();const file=join(directory,'vendors.json');
    const run=()=>spawnSync(process.execPath,['scripts/catalog-integrity.mjs',file],{encoding:'utf8',env:{PATH:process.env.PATH,MONGODB:'must-not-be-used'}});
    await writeFile(file,JSON.stringify(vendors));
    const partial=run();assert.equal(partial.status,0,partial.stderr);
    const report=JSON.parse(partial.stdout);assert.equal(report.warnings,2);assert.equal(report.activationReady,false);
    vendors.records[0].mapId='../invalid';await writeFile(file,JSON.stringify(vendors));
    const invalid=run();assert.equal(invalid.status,1,invalid.stderr);assert.equal(JSON.parse(invalid.stdout).diagnostics[0].code,'INVALID_REFERENCE');
    assert.equal(invalid.stdout.includes('must-not-be-used'),false);
  } finally {await rm(directory,{recursive:true,force:true});}
});
test('bounds diagnostic details while retaining all warning/reference counts',async()=>{
  const [vendors]=await inputs();
  vendors.records[0].items=Array.from({length:1000},(_,i)=>({itemId:900001+i,priceZeny:null}));
  const second=structuredClone(vendors.records[0]);second.id='synthetic_map:30:40:shop';vendors.records.push(second);
  const report=inspectCatalogIntegrity([vendors]);
  assert.equal(report.structurallyValid,true);assert.equal(report.warnings,2002);
  assert.equal(report.references.unverified,2002);assert.equal(report.diagnostics.length,1000);assert.equal(report.omittedDiagnostics,1002);
});
