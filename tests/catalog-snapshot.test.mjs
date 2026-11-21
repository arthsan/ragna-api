import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { importBundle } from '../src/catalog/importer.ts';
import { createMongoImportStore, createMongoReader } from '../src/catalog/mongo-store.ts';
import { database } from './support/catalog-memory-db.mjs';

async function prepared() {
  const bundle = JSON.parse(await readFile(new URL('./fixtures/catalog/skills.json', import.meta.url), 'utf8'));
  // Review/real-data state is simulated only inside this in-memory test store.
  bundle.synthetic = false;
  bundle.records.push({id:900002,name:'Synthetic second skill',maxLevel:1});
  const db = database();
  const store = createMongoImportStore(db);
  const result = await importBundle(bundle, store);
  const pointer = {_id:'old-times/skills',datasetKey:result.key,sha256:result.sha256,reviewed:true};
  db.table('catalog_active').set(pointer._id,pointer);
  return {bundle,db,store,read:createMongoReader(db),result,pointer,manifest:db.table('catalog_datasets').get(result.key)};
}
const mutations = {
  'truncated records despite ready state': ({db,result}) => db.table('catalog_records').delete(`${result.key}/900002`),
  'changed record content despite declared digest': ({db,result}) => db.table('catalog_records').get(`${result.key}/900001`).record.name = 'Tampered',
  'manifest key different from activated identity': ({manifest}) => manifest.key = 're-start/skills/other',
  'zero record count': ({manifest}) => manifest.recordCount = 0,
  'incorrect positive record count': ({manifest}) => manifest.recordCount = 99,
  'unsupported schema version': ({manifest}) => manifest.schemaVersion = 2,
  'provenance changed without digest update': ({manifest}) => manifest.provenance.gameVersion = 'other-version',
  'unknown metadata field': ({manifest}) => manifest.privateExtra = 'must-not-leak',
  'new declared digest without matching contents': ({manifest,pointer}) => {manifest.sha256='b'.repeat(64);pointer.sha256=manifest.sha256;},
  'invalid digest encoding': ({manifest,pointer}) => {manifest.sha256='not-sha256';pointer.sha256=manifest.sha256;},
  'record identity mismatch': ({db,result}) => db.table('catalog_records').get(`${result.key}/900001`)._id = `${result.key}/different`,
  'invalid stored record shape': ({db,result}) => db.table('catalog_records').get(`${result.key}/900001`).record.maxLevel = -1,
};
for (const [label, mutate] of Object.entries(mutations)) {
  test(`reader rejects ${label}`, async () => {
    const context=await prepared();mutate(context);
    assert.deepEqual(await context.read('old-times','skills',900001),{available:false});
  });
}
test('reader rejects an altered synthetic flag unless the entire snapshot digest is valid', async () => {
  const b=JSON.parse(await readFile(new URL('./fixtures/catalog/skills.json',import.meta.url),'utf8'));
  const db=database();const result=await importBundle(b,createMongoImportStore(db));
  db.table('catalog_active').set('old-times/skills',{_id:'old-times/skills',datasetKey:result.key,sha256:result.sha256,reviewed:true});
  db.table('catalog_datasets').get(result.key).synthetic=false;
  assert.deepEqual(await createMongoReader(db)('old-times','skills',900001),{available:false});
});
test('import refuses colliding stored content even if the record count matches', async () => {
  const context=await prepared();
  context.db.table('catalog_records').get(`${context.result.key}/900001`).record.name='Corrupted existing row';
  await assert.rejects(importBundle(context.bundle,context.store),/snapshot/);
  assert.equal(context.db.table('catalog_records').get(`${context.result.key}/900001`).record.name,'Corrupted existing row','never overwrites the conflicting record');
});
test('import refuses tampered manifest metadata with unchanged digest', async () => {
  const context=await prepared();context.manifest.provenance.region='changed';
  await assert.rejects(importBundle(context.bundle,context.store),/different content|manifest/);
});
test('verified snapshot exposes normalized metadata only and distinguishes a missing ID', async () => {
  const context=await prepared();
  const found=await context.read('old-times','skills',900001);
  assert.equal(found.available,true);assert.equal(found.data.name,'Synthetic skill');
  assert.equal('_id' in found.metadata,false);assert.equal('state' in found.metadata,false);
  assert.equal((await context.read('old-times','skills',999999)).data,null);
});
test('reader rejects extra stored rows even when all expected IDs are present',async()=>{
  const context=await prepared();const key=`${context.result.key}/900003`;
  context.db.table('catalog_records').set(key,{_id:key,datasetKey:context.result.key,record:{id:900003,name:'Extra',maxLevel:1}});
  assert.deepEqual(await context.read('old-times','skills',900001),{available:false});
});
test('import requires acknowledgement of the ready-state update',async()=>{
  const bundle=JSON.parse(await readFile(new URL('./fixtures/catalog/skills.json',import.meta.url),'utf8'));
  const db=database();const original=db.collection;
  db.collection=name=>{
    const collection=original(name);const update=collection.updateOne;
    collection.updateOne=async(query,change,options)=>change.$set?.state==='ready'?{matchedCount:0}:update(query,change,options);
    return collection;
  };
  await assert.rejects(importBundle(bundle,createMongoImportStore(db)),/manifest changed during completion/);
});
test('bounded snapshot reads always close cursors, including oversize corruption',async()=>{
  const context=await prepared();
  await context.read('old-times','skills',900001);
  assert.ok(context.db.cursors.every(cursor=>cursor.closed));
  context.db.table('catalog_records').get(`${context.result.key}/900001`).record.name='x'.repeat(20*1024*1024);
  assert.deepEqual(await context.read('old-times','skills',900001),{available:false});
  assert.ok(context.db.cursors.every(cursor=>cursor.closed));
});
