import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { planBundle, parseId } from '../src/catalog/contract.ts';
import { importBundle } from '../src/catalog/importer.ts';
import { parseArguments } from '../scripts/catalog-import.mjs';

export const fixture = async resource => JSON.parse(await readFile(new URL(`./fixtures/catalog/${resource}.json`, import.meta.url), 'utf8'));
for (const resource of ['skills', 'maps', 'vendors', 'items']) {
  test(`validates synthetic ${resource} and produces a deterministic dry-run without a store`, async () => {
    const input = await fixture(resource);
    const original = JSON.stringify(input);
    const plan = planBundle(input);
    assert.equal(plan.manifest.recordCount, 1);
    assert.equal(plan.manifest.synthetic, true);
    assert.equal(plan.manifest.sha256.length, 64);
    assert.equal((await importBundle(input)).mode, 'dry-run');
    assert.equal(JSON.stringify(input), original);
    const reordered = Object.fromEntries(Object.entries(input).reverse());
    assert.equal(planBundle(reordered).manifest.sha256, plan.manifest.sha256);
  });
}
const mutations = {
  'unsupported era': b => b.era = 'renewal',
  'unsupported resource': b => b.resource = 'monsters',
  'unsupported schema': b => b.schemaVersion = 2,
  'missing provenance': b => delete b.provenance,
  'missing era evidence': b => delete b.provenance.eraEvidenceUrl,
  'missing permission evidence': b => delete b.provenance.permissionEvidenceUrl,
  'credentials in URL': b => b.provenance.sourceUrl = 'https://user:secret@example.invalid',
  'insecure source URL': b => b.provenance.sourceUrl = 'http://example.invalid',
  'invalid date': b => b.provenance.retrievedAt = '2026-02-31T00:00:00.000Z',
  'unfounded completeness': b => b.coverage = 'complete',
  'missing synthetic flag': b => delete b.synthetic,
  'empty records': b => b.records = [],
  'duplicate IDs': b => b.records.push(structuredClone(b.records[0])),
  'string numeric ID': b => b.records[0].id = '900001',
  'unsafe numeric ID': b => b.records[0].id = Number.MAX_SAFE_INTEGER,
  'unknown field': b => b.records[0].script = 'untrusted script',
  'invalid skill level': b => b.records[0].maxLevel = 0,
  'operator in datasetId': b => b.datasetId = '$set',
};
for (const [label, mutate] of Object.entries(mutations)) {
  test(`rejects ${label} before any store operation`, async () => {
    const b = await fixture('skills'); mutate(b);
    let calls = 0;
    await assert.rejects(importBundle(b, { reserve: async () => { calls++; } }), /Invalid catalog/);
    assert.equal(calls, 0);
  });
}
test('validates vendor coordinates, inventory duplicates and unknown prices', async () => {
  const b = await fixture('vendors');
  assert.equal(planBundle(b).bundle.records[0].items[0].priceZeny, null);
  for (const mutate of [b => b.records[0].x = -1, b => b.records[0].items.push(b.records[0].items[0]), b => b.records[0].items[0].priceZeny = -1, b => b.records[0].mapId = '../map']) {
    const input = structuredClone(b); mutate(input);
    assert.throws(() => planBundle(input), /Invalid catalog/);
  }
});
test('record order is canonical and changed content requires a different digest', async () => {
  const b = await fixture('skills'); b.records.push({ id: 900002, name: 'Synthetic second skill', maxLevel: 1 });
  const digest = planBundle(b).manifest.sha256;
  b.records.reverse(); assert.equal(planBundle(b).manifest.sha256, digest);
  b.provenance.gameVersion = 'different'; assert.notEqual(planBundle(b).manifest.sha256, digest);
});
test('lookup IDs reject arrays, coercion, operators and traversal', () => {
  for (const input of [undefined, [], ['1'], '1.0', '1e3', ' 1', '01', '-1', '0', '2147483648', '$gt']) assert.equal(parseId('skills', input), null);
  for (const input of ['../map', '$where', '', ['map'], 'map/other']) assert.equal(parseId('maps', input), null);
  assert.equal(parseId('skills', '2147483647'), 2147483647);
  assert.equal(parseId('maps', '1@synthetic'), '1@synthetic');
});
test('CLI only accepts explicit loopback test import options and defaults to dry-run', () => {
  assert.equal(parseArguments(['file.json']).apply, false);
  assert.deepEqual(parseArguments(['file.json', '--apply-test', '--database', 'ragna_catalog_test_fixture', '--port', '27018']), {file:'file.json', apply:true, database:'ragna_catalog_test_fixture', port:27018});
  for (const args of [[], ['file.json','--uri','mongodb://remote'], ['file.json','--apply-test'], ['file.json','--apply-test','--database','old-times'], ['file.json','--database','ragna_catalog_test_x'], ['file.json','--port','27017'], ['file.json','--apply-test','--database','ragna_catalog_test_x','--port','1e3'], ['file.json','--apply-test','--apply-test']]) assert.throws(() => parseArguments(args));
});
test('actual CLI dry-run ignores production environment and reports synthetic provenance', () => {
  const result = spawnSync(process.execPath, ['scripts/catalog-import.mjs', 'tests/fixtures/catalog/skills.json'], { encoding: 'utf8', env: { PATH: process.env.PATH, MONGODB: 'must-not-be-used', GA4_API_SECRET: 'synthetic-not-a-secret' } });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.mode, 'dry-run'); assert.equal(output.synthetic, true); assert.equal(output.recordCount, 1);
  assert.equal(result.stdout.includes('must-not-be-used'), false);
});
