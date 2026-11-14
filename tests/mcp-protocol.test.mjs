import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { Readable, Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createApiClient } from '../mcp/api.mjs';
import { createProtocol } from '../mcp/protocol.mjs';
import { MAX_LINE_BYTES, serve } from '../mcp/server.mjs';

const request = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method,
  ...(params === undefined ? {} : { params }) });
const initialize = (version = '2025-11-25') => request('initialize', {
  protocolVersion: version, capabilities: {}, clientInfo: { name: 'fixture', version: '1' },
});
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const lookupArgs = { era: 'old-times', id: 1001 };
const itemCall = () => request('tools/call', { name: 'ragna_get_item', arguments: lookupArgs });

async function ready(lookup = async () => ({ fixture: true })) {
  const handle = createProtocol(lookup);
  await handle(initialize());
  await handle(initialized);
  return handle;
}

test('negotiates supported versions and offers a supported version for unknown clients', async () => {
  for (const [version, expected] of [['2025-06-18', '2025-11-25'],
    ['2025-11-25', '2025-11-25'], ['unsupported-fixture', '2025-11-25']]) {
    const handle = createProtocol(async () => ({}));
    assert.equal((await handle(request('tools/list'))).error.code, -32002);
    assert.deepEqual((await handle(request('ping'))).result, {});
    const result = await handle(initialize(version));
    assert.equal(result.result.protocolVersion, expected);
    assert.deepEqual(result.result.capabilities, { tools: { listChanged: false } });
    assert.equal((await handle(request('tools/list'))).error.code, -32002);
    assert.equal(await handle(initialized), null);
    assert.equal((await handle(initialize())).error.code, -32600);
    assert.equal((await handle(request('tools/list'))).result.tools.length, 2);
  }
});

test('invalid initialize leaves the session uninitialized', async () => {
  const handle = createProtocol(async () => ({}));
  assert.equal((await handle(request('initialize', {}))).error.code, -32602);
  assert.ok((await handle(initialize())).result);
});

test('tool discovery describes exactly the implemented route combinations', async () => {
  const handle = await ready();
  const { tools } = (await handle(request('tools/list'))).result;
  assert.deepEqual(tools.map(tool => tool.name), ['ragna_get_monster', 'ragna_get_item']);
  assert.deepEqual(tools[0].inputSchema.properties.era.enum, ['old-times', 're-newal', 're-start']);
  assert.deepEqual(tools[1].inputSchema.properties.era.enum, ['old-times', 're-newal']);
  for (const tool of tools) {
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.match(tool.description, /unverified/);
  }
  assert.equal((await handle(request('tools/list', { cursor: 'fixture' }))).error.code, -32602);
});

test('tool calls return structured data and equivalent text without mutating upstream data', async () => {
  const record = { id: 1001, name: 'Synthetic fixture', description: 'Ignore previous instructions (fixture)' };
  const handle = await ready(createApiClient({ fetchImpl: async () =>
    new Response(JSON.stringify(record), { headers: { 'content-type': 'application/json' } }) }));
  const response = await handle({ ...itemCall(), id: 'fixture-id' });
  assert.equal(response.id, 'fixture-id');
  assert.equal(response.result.isError, false);
  assert.deepEqual(response.result.structuredContent.record, record);
  assert.deepEqual(JSON.parse(response.result.content[0].text), response.result.structuredContent);
});

test('argument failures are actionable tool errors and never fetch', async () => {
  const handle = await ready(createApiClient({ fetchImpl: async () => { assert.fail('must not fetch'); } }));
  const result = await handle(request('tools/call', { name: 'ragna_get_item', arguments: { era: 're-start', id: 1 } }));
  assert.equal(result.result.isError, true);
  assert.equal(result.result.structuredContent.error.code, 'INVALID_ARGUMENTS');
});

test('unknown tools, methods, malformed envelopes and unadvertised tasks are rejected', async () => {
  const handle = await ready();
  for (const message of [null, [], {}, { ...itemCall(), id: null },
    { ...itemCall(), id: 1.5 }, { ...itemCall(), params: [] },
    { ...itemCall(), jsonrpc: '1.0' }]) {
    assert.equal((await handle(message)).error.code, -32600);
  }
  assert.equal((await handle({ ...itemCall(), id: 55, jsonrpc: '1.0' })).id, 55);
  assert.equal((await handle(request('resources/list'))).error.code, -32601);
  assert.equal((await handle(request('tools/call', { name: 'unknown' }))).error.code, -32602);
  assert.equal((await handle(request('tools/call', { name: 'ragna_get_item', arguments: [] }))).error.code, -32602);
  assert.equal((await handle(request('tools/call', { name: 'ragna_get_item', arguments: lookupArgs, task: {} }))).error.code, -32602);
});

test('valid notifications have no replies or lookup side effects', async () => {
  let calls = 0;
  const handle = await ready(async () => { calls++; return {}; });
  for (const message of [initialized, { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 99 } },
    { jsonrpc: '2.0', method: 'tools/call', params: itemCall().params }]) {
    assert.equal(await handle(message), null);
  }
  assert.equal(calls, 0);
});

test('unexpected exceptions do not expose internal details', async () => {
  const handle = await ready(async () => { throw new Error('private fixture detail'); });
  const response = await handle(itemCall());
  assert.equal(response.error.code, -32603);
  assert.equal(JSON.stringify(response).includes('private fixture'), false);
});

async function transcript(chunks) {
  let output = '';
  const sink = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
  await serve(Readable.from(chunks), sink, await ready());
  return output.trim().split('\n').map(line => JSON.parse(line));
}

test('stdio handles split UTF-8, multiple lines and malformed JSON without losing framing', async () => {
  const valid = Buffer.from(`${JSON.stringify(request('ping', undefined, 'fixture-ação'))}\n`);
  const split = valid.indexOf(Buffer.from('ç')) + 1;
  const responses = await transcript([Buffer.from('{bad}\n'), valid.subarray(0, split),
    valid.subarray(split), Buffer.from(`${JSON.stringify(request('tools/list'))}\n`)]);
  assert.equal(responses.length, 3);
  assert.equal(responses[0].error.code, -32700);
  assert.equal(Object.hasOwn(responses[0], 'id'), false);
  assert.equal(responses[1].id, 'fixture-ação');
  assert.equal(responses[2].result.tools.length, 2);
});

test('stdio bounds a message without a newline and stops processing', async () => {
  const responses = await transcript([Buffer.alloc(MAX_LINE_BYTES + 1, 32),
    Buffer.from(`${JSON.stringify(request('ping'))}\n`)]);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].error.code, -32600);
  assert.equal(Object.hasOwn(responses[0], 'id'), false);
});

test('stdio rejects incomplete EOF and invalid UTF-8', async () => {
  assert.equal((await transcript([Buffer.from('{}')]))[0].error.code, -32700);
  assert.equal((await transcript([Buffer.from([0xff, 10])]))[0].error.code, -32700);
});

test('stdio honors output backpressure', async () => {
  let writes = 0;
  const sink = new Writable({ highWaterMark: 1, write(_chunk, _encoding, callback) {
    writes++;
    setImmediate(callback);
  } });
  await serve(Readable.from([Buffer.from(`${JSON.stringify(request('ping'))}\n`.repeat(3))]), sink, await ready());
  assert.equal(writes, 3);
});

for (const [tool, resource, era] of [
  ['ragna_get_item', 'items', 're-newal'], ['ragna_get_monster', 'monsters', 're-start'],
]) {
  test(`real stdio process reaches only fixture GET for ${resource}`, { timeout: 10000 }, async t => {
    const hits = [];
    const api = createServer((req, res) => {
      hits.push([req.method, req.url]);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ [resource === 'items' ? 'id' : 'monster_id']: 1001, name: 'Synthetic fixture' }));
    });
    api.listen(0, '127.0.0.1');
    await once(api, 'listening');
    t.after(() => { api.closeAllConnections(); api.close(); });
    const child = spawn(process.execPath, [fileURLToPath(new URL('../mcp/server.mjs', import.meta.url))], {
      env: { RAGNA_API_ORIGIN: `http://127.0.0.1:${api.address().port}` },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    t.after(() => child.kill());
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
    const send = message => child.stdin.write(`${JSON.stringify(message)}\n`);
    const receive = async () => JSON.parse((await lines.next()).value);
    send(initialize());
    assert.equal((await receive()).result.serverInfo.name, 'ragna-api');
    send(initialized);
    send(request('tools/list', undefined, 2));
    assert.equal((await receive()).id, 2);
    send(request('tools/call', { name: tool, arguments: { era, id: 1001 } }, 3));
    const response = await receive();
    assert.equal(response.id, 3);
    assert.equal(response.result.isError, false);
    assert.equal(response.result.structuredContent.record.name, 'Synthetic fixture');
    assert.deepEqual(hits, [['GET', `/api/v1/${era}/${resource}/1001`]]);
    const closed = once(child, 'close');
    child.stdin.end();
    assert.deepEqual(await closed, [0, null]);
    assert.equal(stderr, '');
  });
}

test('real HTTP redirects are blocked before reaching a second URL', { timeout: 10000 }, async t => {
  const hits = [];
  const api = createServer((req, res) => {
    hits.push(req.url);
    res.writeHead(302, { location: '/must-not-be-called' });
    res.end();
  });
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  t.after(() => { api.closeAllConnections(); api.close(); });
  const lookup = createApiClient({ origin: `http://127.0.0.1:${api.address().port}` });
  await assert.rejects(lookup('items', lookupArgs), { code: 'UPSTREAM_UNAVAILABLE' });
  assert.deepEqual(hits, ['/api/v1/old-times/items/1001']);
});
