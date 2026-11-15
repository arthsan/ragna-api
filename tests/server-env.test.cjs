const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const sentinel = 'mongodb://127.0.0.1:1/RAGNA_ENV_TEST_SENTINEL_NOT_A_SECRET';

test('Next config never exports MongoDB through build-time env', () => {
  const previous = process.env.MONGODB;
  try {
    process.env.MONGODB = sentinel;
    const configPath = path.join(root, 'next.config.js');
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);
    assert.equal(Object.hasOwn(config.env ?? {}, 'MONGODB'), false);
    assert.equal(JSON.stringify(config).includes(sentinel), false);
  } finally {
    if (previous === undefined) delete process.env.MONGODB;
    else process.env.MONGODB = previous;
  }
});

test('MongoDB service retains server runtime environment lookup', () => {
  const service = fs.readFileSync(path.join(root, 'src/services/mongodb.ts'), 'utf8');
  assert.match(service, /const mongoUri = process\.env\.MONGODB;/);
});

// Optional post-build regression: use only a fictitious sentinel, never credentials.
test('built browser assets do not contain the sentinel', {
  skip: process.env.CHECK_BUILT_ENV !== '1',
}, () => {
  const directory = path.join(root, '.next/static');
  assert.ok(fs.existsSync(directory), 'Run the documented sentinel build first');
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else assert.equal(fs.readFileSync(file).includes(Buffer.from('RAGNA_ENV_TEST_SENTINEL_NOT_A_SECRET')), false, path.relative(root, file));
    }
  };
  visit(directory);
});
