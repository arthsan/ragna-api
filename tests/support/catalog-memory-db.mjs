// Controlled driver-shaped store: insertion uniqueness, filters and $setOnInsert semantics.
export function database(name = 'ragna_catalog_test_fixture') {
  const tables = new Map(); const writes = []; const cursors = [];
  let failBatch = 0; let batches = 0;
  const table = key => { if (!tables.has(key)) tables.set(key, new Map()); return tables.get(key); };
  const matches = (row, query) => Object.entries(query).every(([key, value]) => row[key] === value);
  const collection = name => ({
    async findOne(query) { return structuredClone([...table(name).values()].find(row => matches(row, query)) ?? null); },
    async updateOne(query, update, options = {}) {
      writes.push(name);
      const rows = table(name); const found = [...rows.values()].find(row => matches(row, query));
      if (found) Object.assign(found, structuredClone(update.$set ?? {}));
      else if (options.upsert) {
        if (rows.has(query._id)) throw new Error('Duplicate _id');
        rows.set(query._id, { ...structuredClone(query), ...structuredClone(update.$setOnInsert ?? {}), ...structuredClone(update.$set ?? {}) });
      }
      return { matchedCount: found ? 1 : 0 };
    },
    find(query) {
      let limit = Infinity; let closed = false;
      const cursorState = { closed: false }; cursors.push(cursorState);
      return {
        limit(value) { limit = value; return this; },
        maxTimeMS(value) { if (value !== 5000) throw new Error('Expected bounded query'); return this; },
        async *[Symbol.asyncIterator]() {
          for (const row of [...table(name).values()].filter(row => matches(row, query)).slice(0, limit)) {
            if (closed) break;
            yield structuredClone(row);
          }
        },
        async close() { closed = true; cursorState.closed = true; },
      };
    },
    async bulkWrite(operations) {
      batches++; if (batches === failBatch) throw new Error('Injected write failure');
      for (const { updateOne: op } of operations) await collection(name).updateOne(op.filter, op.update, { upsert: op.upsert });
    },
    async countDocuments(query) { return [...table(name).values()].filter(row => matches(row, query)).length; },
  });
  return { databaseName: name, collection, table, writes, cursors, failBatchAt: value => { failBatch = value; } };
}
