import { open } from 'node:fs/promises';
import { MAX_BYTES } from '../src/catalog/contract.ts';

export async function readCatalogJson(file, budget = MAX_BYTES) {
  const handle = await open(file, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > budget) throw new Error('Expected bounded catalog JSON file');
    const buffer = Buffer.alloc(budget + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > budget) throw new Error('Catalog input exceeds byte limit');
    return { value: JSON.parse(buffer.subarray(0, length).toString('utf8')), bytes: length };
  } finally { await handle.close(); }
}
