const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function harness(env = {}, brokenLogger = false) {
  const entries = [];
  const load = (file, deps = {}) => {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      exports, require: name => { assert.ok(name in deps); return deps[name]; },
      process: { env }, console: { info: text => {
        if (brokenLogger) throw new Error('log sink unavailable');
        entries.push(JSON.parse(text));
      } },
      fetch: () => { throw new Error('Telemetry must not send network requests'); },
    });
    return exports;
  };
  const telemetry = load('src/lib/api-telemetry.ts');
  const wrapper = load('src/lib/api-analytics.ts', { './api-telemetry': telemetry });
  return { entries, ...telemetry, ...wrapper };
}
const metrics = { method: 'GET', status: 200, latencyMs: 12.4, resourceType: 'items', db: 'old-times' };

test('operational metrics remain useful without GA4 credentials or client IDs', () => {
  const h = harness({ GA4_API_SECRET: 'fixture', NEXT_PUBLIC_GA_ID: 'G-FIXTURE' });
  h.trackApiRequest(metrics); h.trackApiRequest(metrics);
  assert.equal(h.entries.length, 2);
  assert.deepEqual(h.entries[0], { event: 'api_request', schema_version: 1,
    api_route: '/api/v1/old-times/items/:id', method: 'GET', status: 200,
    latency_ms: 12, resource_type: 'items', db: 'old-times' });
  assert.deepEqual(h.entries[0], h.entries[1]);
});
test('strict allowlists and finite metrics prevent PII and cardinality leaks', () => {
  const h = harness();
  h.trackApiRequest({ ...metrics, method: 'secret@example.com', resourceType: 'private', db: 'secret',
    apiRoute: '/secret?token=private', status: NaN, latencyMs: Infinity, client_id: 'secret' });
  assert.deepEqual(h.entries[0], { event: 'api_request', schema_version: 1,
    api_route: '/api/other', method: 'OTHER', status: 0, latency_ms: 0,
    resource_type: 'other', db: 'other' });
});
test('opt-out disables operational logs; failed logger never throws', () => {
  const h = harness({ API_TELEMETRY_ENABLED: 'false' });
  h.trackApiRequest(metrics); assert.equal(h.entries.length, 0);
  assert.doesNotThrow(() => harness({}, true).trackApiRequest(metrics));
});
test('version and resource categories including future catalog routes are bounded', () => {
  const h = harness();
  for (const db of ['old-times', 're-newal', 're-start']) {
    for (const resourceType of ['items', 'monsters', 'skills', 'maps', 'vendors']) {
      h.trackApiRequest({ ...metrics, db, resourceType });
      assert.equal(h.entries.at(-1).api_route, `/api/v1/${db}/${resourceType}/:id`);
    }
  }
  h.trackApiRequest({ ...metrics, resourceType: 'health', db: undefined, latencyMs: -2 });
  assert.equal(h.entries.at(-1).api_route, '/api/health');
  assert.equal(h.entries.at(-1).latency_ms, 0);
});
test('wrapper logs actual successful status, never reads raw URL or request identifiers', async () => {
  const h = harness();
  const req = { method: 'GET', get url() { throw new Error('raw URL accessed'); },
    get headers() { throw new Error('headers accessed'); } };
  const res = { statusCode: 200 };
  await h.withApiAnalytics(async (_req, response) => { response.statusCode = 404; }, metrics)(req, res);
  assert.equal(h.entries.length, 1); assert.equal(h.entries[0].status, 404);
});
test('handler errors are preserved and counted as failures', async () => {
  const h = harness();
  const error = new Error('original');
  await assert.rejects(h.withApiAnalytics(async () => { throw error; }, metrics)({ method: 'GET' }, { statusCode: 200 }), e => e === error);
  assert.equal(h.entries.length, 1); assert.equal(h.entries[0].status, 500);
  await assert.rejects(h.withApiAnalytics(async () => { throw error; }, metrics)({}, { statusCode: 503 }), e => e === error);
  assert.equal(h.entries[1].status, 503);
});
