import { open } from 'node:fs/promises';
import { importBundle } from '../src/catalog/importer.ts';
import { MAX_BYTES } from '../src/catalog/contract.ts';

export function parseArguments(args) {
  const [file, ...options] = args;
  if (!file || file.startsWith('--')) throw new Error('Usage: node scripts/catalog-import.mjs FILE [--apply-test --database ragna_catalog_test_NAME --port PORT]');
  let apply = false;
  let database;
  let port = 27017;
  const seen = new Set();
  for (let i = 0; i < options.length; i++) {
    const flag = options[i];
    if (seen.has(flag)) throw new Error('Duplicate option');
    seen.add(flag);
    if (flag === '--apply-test') apply = true;
    else if (flag === '--database') database = options[++i];
    else if (flag === '--port') {
      const value = options[++i];
      if (!/^[0-9]+$/.test(value ?? '')) throw new Error('Invalid port');
      port = Number(value);
    } else throw new Error('Unknown option');
  }
  if (port < 1 || port > 65535) throw new Error('Invalid port');
  if (apply && !/^ragna_catalog_test_[a-z0-9_]+$/.test(database ?? '')) throw new Error('A dedicated test database is required');
  if (!apply && (database !== undefined || seen.has('--port'))) throw new Error('Database options require --apply-test');
  return { file, apply, database, port };
}
export async function run(args) {
  const options = parseArguments(args);
  const handle = await open(options.file, 'r');
  let input;
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error('Expected a JSON file of at most 20 MiB');
    // Bounded even if the file grows after stat; reject rather than truncate.
    const buffer = Buffer.alloc(MAX_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > MAX_BYTES) throw new Error('File exceeds 20 MiB');
    input = JSON.parse(buffer.subarray(0, length).toString('utf8'));
  } finally { await handle.close(); }
  const plan = await importBundle(input);
  if (!options.apply) return plan;
  // Never reads MONGODB or any .env file; network destination is fixed loopback.
  const [{ MongoClient }, { createMongoImportStore }] = await Promise.all([
    import('mongodb'), import('../src/catalog/mongo-store.ts'),
  ]);
  const client = new MongoClient(`mongodb://127.0.0.1:${options.port}`, {
    maxPoolSize: 1, serverSelectionTimeoutMS: 2000, connectTimeoutMS: 2000,
  });
  try {
    await client.connect();
    return await importBundle(input, createMongoImportStore(client.db(options.database)));
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2)).then(result => console.log(JSON.stringify(result, null, 2))).catch(() => {
    console.error('Catalog import failed. Check arguments, bundle validation and the isolated test database.');
    process.exitCode = 1;
  });
}
