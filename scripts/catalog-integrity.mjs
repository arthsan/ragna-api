import { pathToFileURL } from 'node:url';
import { MAX_BYTES } from '../src/catalog/contract.ts';
import { inspectCatalogIntegrity } from '../src/catalog/integrity.ts';
import { readCatalogJson } from './catalog-files.mjs';

export async function run(files) {
  if (!files.length || files.length > 12 || files.some(file => file.startsWith('--'))) {
    throw new Error('Usage: node scripts/catalog-integrity.mjs BUNDLE.json [BUNDLE.json ...] (maximum 12 files)');
  }
  const inputs = [];
  let budget = MAX_BYTES;
  for (const file of files) {
    const { value, bytes } = await readCatalogJson(file, budget);
    inputs.push(value); budget -= bytes;
  }
  return inspectCatalogIntegrity(inputs);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2)).then(report => {
    console.log(JSON.stringify(report, null, 2));
    if (!report.structurallyValid) process.exitCode = 1;
  }).catch(() => {
    console.error('Catalog integrity diagnosis failed. Supply 1-12 bounded JSON bundles.');
    process.exitCode = 1;
  });
}
