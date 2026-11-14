import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { createApiClient, ERAS } from '../mcp/api.mjs';

const json = (data, init = {}) => new Response(JSON.stringify(data), {
  headers: { 'content-type': 'application/json' }, ...init,
});
const args = { era: 'old-times', id: 1001 };

for (const [resource, eras] of Object.entries(ERAS)) {
  for (const era of eras) {
    test(`GET ${era}/${resource} preserves the record and marks provenance unknown`, async () => {
      const parameter = resource === 'items' ? 'item' : 'monster';
      assert.ok(existsSync(new URL(`../src/pages/api/v1/${era}/${resource}/[${parameter}].tsx`, import.meta.url)),
        'An advertised lookup must have an existing REST route');
      const record = { [resource === 'items' ? 'id' : 'monster_id']: 1001,
        name: 'Synthetic fixture; no Ragnarok dataset', description: 'Untrusted fixture text' };
      const lookup = createApiClient({ fetchImpl: async (url, options) => {
        assert.equal(url, `https://ragnapi.com/api/v1/${era}/${resource}/1001`);
        assert.equal(options.method, 'GET');
        assert.equal(options.redirect, 'error');
        assert.equal(options.credentials, 'omit');
        assert.deepEqual(options.headers, { accept: 'application/json' });
        assert.ok(options.signal instanceof AbortSignal);
        return json(record);
      } });
      const result = await lookup(resource, { era, id: 1001 });
      assert.deepEqual(result.record, record);
      assert.equal(result.era, era);
      assert.equal(result.provenance.datasetVersion, null);
      assert.equal(result.provenance.sourceVerified, false);
      assert.equal(result.provenance.coverage, 'unknown');
    });
  }
}

test('rejects invalid arguments and unavailable routes before any fetch', async () => {
  let calls = 0;
  const lookup = createApiClient({ fetchImpl: async () => { calls++; return json({}); } });
  const invalid = [null, undefined, [], {}, { era: 'old-times' },
    { ...args, id: '1001' }, { ...args, id: 0 }, { ...args, id: -1 },
    { ...args, id: 1.2 }, { ...args, id: NaN }, { ...args, id: Infinity },
    { ...args, id: Number.MAX_SAFE_INTEGER + 1 }, { ...args, era: '../health' },
    { ...args, era: 'renewal' }, { ...args, url: 'http://localhost' },
    { ...args, era: 're-start' }];
  for (const value of invalid) {
    await assert.rejects(lookup('items', value), { code: 'INVALID_ARGUMENTS' });
  }
  assert.equal(calls, 0);
});

test('accepts maximum safe integer ID without coercion', async () => {
  const id = Number.MAX_SAFE_INTEGER;
  const lookup = createApiClient({ fetchImpl: async () => json({ id }) });
  assert.equal((await lookup('items', { ...args, id })).id, id);
});

test('allows only the canonical HTTPS API or explicitly configured HTTP loopback', () => {
  for (const origin of ['http://ragnapi.com', 'https://example.invalid',
    'https://ragnapi.com:444', 'https://ragnapi.com/api', 'https://ragnapi.com?key=fixture',
    'https://ragnapi.com/#fixture', 'https://fixture:fixture@ragnapi.com',
    'http://127.0.0.2', 'file:///tmp/fixture', 'not-a-url']) {
    assert.throws(() => createApiClient({ origin }));
  }
  for (const origin of ['https://ragnapi.com', 'http://127.0.0.1:1234',
    'http://localhost:1234', 'http://[::1]:1234']) {
    assert.equal(typeof createApiClient({ origin }), 'function');
  }
});

test('rate limit is shared across tools, with no retry', async () => {
  let time = 100;
  let calls = 0;
  const lookup = createApiClient({ now: () => time, fetchImpl: async () => {
    calls++;
    return json({ id: 1001, monster_id: 1001 });
  } });
  await lookup('items', args);
  await assert.rejects(lookup('monsters', args), { code: 'RATE_LIMITED' });
  time = 1100;
  await lookup('monsters', args);
  assert.equal(calls, 2);
});

for (const [label, response, code] of [
  ['404', () => new Response(null, { status: 404 }), 'NO_RECORD'],
  ['204', () => new Response(null, { status: 204 }), 'NO_RECORD'],
  ['500', () => new Response('private fixture details', { status: 500 }), 'UPSTREAM_UNAVAILABLE'],
  ['429', () => new Response('private fixture details', { status: 429 }), 'UPSTREAM_UNAVAILABLE'],
  ['empty 200', () => new Response('', { headers: { 'content-type': 'application/json' } }), 'NO_RECORD'],
  ['null', () => json(null), 'NO_RECORD'],
  ['HTML', () => new Response('<html>fixture</html>'), 'INVALID_RESPONSE'],
  ['invalid JSON', () => new Response('{', { headers: { 'content-type': 'application/json' } }), 'INVALID_RESPONSE'],
  ['invalid UTF-8 JSON', () => new Response(Buffer.concat([
    Buffer.from('{"id":1001,"name":"'), Buffer.from([0xff]), Buffer.from('"}'),
  ]), { headers: { 'content-type': 'application/json' } }), 'INVALID_RESPONSE'],
  ['array', () => json([{ id: 1001 }]), 'INVALID_RESPONSE'],
  ['string', () => json('fixture'), 'INVALID_RESPONSE'],
  ['wrong ID', () => json({ id: 2 }), 'INVALID_RESPONSE'],
  ['string ID', () => json({ id: '1001' }), 'INVALID_RESPONSE'],
]) {
  test(`maps ${label} to ${code} without disclosing the upstream body`, async () => {
    const lookup = createApiClient({ fetchImpl: async () => response() });
    await assert.rejects(lookup('items', args), error => {
      assert.equal(error.code, code);
      assert.equal(error.message.includes('private fixture'), false);
      return true;
    });
  });
}

test('bounds streamed responses even without Content-Length and cancels the body', async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(9)); },
    cancel() { cancelled = true; },
  });
  const lookup = createApiClient({ maxResponseBytes: 8, fetchImpl: async () =>
    new Response(body, { headers: { 'content-type': 'application/json' } }) });
  await assert.rejects(lookup('items', args), { code: 'RESPONSE_TOO_LARGE' });
  assert.equal(cancelled, true);
});

test('timeouts include response-body stalls', async () => {
  const lookup = createApiClient({ timeoutMs: 20, fetchImpl: async (_url, options) => {
    const body = new ReadableStream({
      start(controller) {
        options.signal.addEventListener('abort', () => controller.error(new Error('fixture timeout')));
      },
    });
    return new Response(body, { headers: { 'content-type': 'application/json' } });
  } });
  await assert.rejects(lookup('items', args), { code: 'UPSTREAM_TIMEOUT' });
});

test('network failures are sanitized', async () => {
  const lookup = createApiClient({ fetchImpl: async () => {
    throw new Error('mongodb://fake-user:fake-pass@fixture.invalid/private');
  } });
  await assert.rejects(lookup('items', args), error => {
    assert.equal(error.code, 'UPSTREAM_UNAVAILABLE');
    assert.equal(error.message.includes('fake-pass'), false);
    return true;
  });
});
