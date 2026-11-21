import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { importBundle } from '../src/catalog/importer.ts';
import { planBundle } from '../src/catalog/contract.ts';
import { createMongoImportStore, createMongoReader } from '../src/catalog/mongo-store.ts';
import { createCatalogHandler } from '../src/catalog/handler.ts';

const fixture = async resource => JSON.parse(await readFile(new URL(`./fixtures/catalog/${resource}.json`, import.meta.url), 'utf8'));
import { database } from './support/catalog-memory-db.mjs';

test('Mongo adapter imports idempotently without writing legacy collections or active pointers', async () => {
  const db = database(); const store = createMongoImportStore(db); const b = await fixture('skills');
  const first = await importBundle(b, store); const snapshot = structuredClone(db.table('catalog_records'));
  await importBundle(b, store);
  assert.deepEqual(db.table('catalog_records'), snapshot);
  assert.equal(db.table('catalog_records').size, 1);
  assert.equal(db.table('catalog_datasets').get(first.key).state, 'ready');
  assert.ok(db.writes.every(name => ['catalog_datasets','catalog_records'].includes(name)));
  assert.equal(db.table('catalog_active').size, 0);
  b.records[0].name = 'Changed';
  await assert.rejects(importBundle(b, store), /different content/);
  assert.deepEqual(db.table('catalog_records'), snapshot);
});
test('failed batches remain loading and an exact replay resumes', async () => {
  const db = database(); const store = createMongoImportStore(db); const b = await fixture('skills');
  b.records = Array.from({length: 251}, (_, i) => ({id:900001+i,name:`Synthetic ${i}`,maxLevel:1}));
  db.failBatchAt(2); await assert.rejects(importBundle(b, store), /Injected/);
  const { manifest } = planBundle(b);
  assert.equal(db.table('catalog_datasets').get(manifest.key).state, 'loading');
  assert.equal(db.table('catalog_records').size, 250);
  await importBundle(b, store); assert.equal(db.table('catalog_records').size, 251);
  assert.equal(db.table('catalog_datasets').get(manifest.key).state, 'ready');
});
test('count mismatch prevents ready state', async () => {
  const db = database(); const store = createMongoImportStore(db);
  store.countRecords = async () => 0;
  await assert.rejects(importBundle(await fixture('skills'), store), /count mismatch/);
  assert.equal([...db.table('catalog_datasets').values()][0].state, 'loading');
});
test('Mongo writer rejects legacy and public database names before collection access', () => {
  for (const name of ['old-times','re-newal','re-start','ragna-catalog','test','ragna_catalog_test_']) assert.throws(() => createMongoImportStore({databaseName:name, collection(){throw new Error('Must not access collections');}}), /dedicated test database/);
});
test('reader requires explicit reviewed, real, ready, era and hash-matched snapshot', async () => {
  const db = database(); const b = await fixture('skills'); const result = await importBundle(b, createMongoImportStore(db));
  const read = createMongoReader(db);
  assert.deepEqual(await read('old-times','skills',900001), {available:false});
  const pointer = {_id:'old-times/skills',datasetKey:result.key,sha256:result.sha256,reviewed:true};
  db.table('catalog_active').set(pointer._id,pointer);
  assert.deepEqual(await read('old-times','skills',900001), {available:false}, 'synthetic snapshots cannot be published');
  // A distinct test-only bundle is hashed with synthetic:false from the start.
  const real = structuredClone(b); real.synthetic = false; real.datasetId = 'simulated-real-v1';
  const realResult = await importBundle(real, createMongoImportStore(db));
  pointer.datasetKey = realResult.key; pointer.sha256 = realResult.sha256;
  const manifest = db.table('catalog_datasets').get(realResult.key);
  assert.equal((await read('old-times','skills',900001)).data.name, 'Synthetic skill');
  assert.equal((await read('old-times','skills',999999)).data,null);
  assert.deepEqual(await read('re-start','skills',900001),{available:false});
  for (const [field, invalid] of [['state','loading'],['era','re-start'],['resource','maps'],['sha256','mismatch']]) {
    const original=manifest[field];manifest[field]=invalid;
    assert.deepEqual(await read('old-times','skills',900001),{available:false});manifest[field]=original;
  }
  pointer.reviewed=false;assert.deepEqual(await read('old-times','skills',900001),{available:false});
});
function response() {
  return { code:0, headers:{}, body:undefined,
    setHeader(key,value){this.headers[key]=value;}, status(value){this.code=value;return this;}, json(value){this.body=value;return this;} };
}
for (const era of ['old-times','re-newal','re-start']) for (const resource of ['skills','maps','vendors', ...(era==='re-start'?['items']:[])]) {
  test(`handler ${era}/${resource} validates and preserves the normalized envelope`, async () => {
    const b=await fixture(resource); b.era=era;
    const {manifest}=planBundle(b); const data=b.records[0]; let call;
    const handler=createCatalogHandler(resource,async (...args)=>{call=args;return {available:true,metadata:manifest,data};});
    const res=response();await handler({method:'GET',query:{era,id:String(data.id)}},res);
    assert.equal(res.code,200);assert.deepEqual(call,[era,resource,data.id]);assert.deepEqual(res.body,{data,dataset:manifest});
    assert.match(res.headers['Cache-Control'],/s-maxage=300/);
  });
}
test('handler errors are uncached and sanitized; invalid lookups do not access storage', async () => {
  let calls=0;const handler=createCatalogHandler('skills',async()=>{calls++;throw new Error('private details');});
  for (const [method,query,code] of [['POST',{era:'old-times',id:'1'},405],['GET',{era:'unknown',id:'1'},400],['GET',{era:['old-times'],id:'1'},400],['GET',{era:'old-times',id:['1']},400]]) {
    const res=response();await handler({method,query},res);assert.equal(res.code,code);assert.equal(res.headers['Cache-Control'],'no-store');
  }
  assert.equal(calls,0);
  const res=response();await handler({method:'GET',query:{era:'old-times',id:'1'}},res);
  assert.equal(res.code,503);assert.equal(JSON.stringify(res.body).includes('private'),false);
});
test('handler distinguishes unpublished datasets from missing records in a partial catalog', async () => {
  for (const [result,expected] of [[{available:false},503],[{available:true,data:null},404]]) {
    const res=response();await createCatalogHandler('skills',async()=>result)({method:'GET',query:{era:'old-times',id:'1'}},res);
    assert.equal(res.code,expected);assert.equal(res.headers['Cache-Control'],'no-store');
  }
});
test('fixed re-start item route ignores era query overrides', async () => {
  let actual;const res=response();await createCatalogHandler('items',async era=>{actual=era;return {available:false};},'re-start')({method:'GET',query:{era:'re-newal',id:'1'}},res);
  assert.equal(actual,'re-start');assert.equal(res.code,503);
});
