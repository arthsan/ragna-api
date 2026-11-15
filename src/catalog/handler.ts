import type { NextApiRequest, NextApiResponse } from 'next';
import { isEra, parseId, type Manifest, type Era, type Resource, type CatalogRecord } from './contract.ts';

type Lookup = (era: Era, resource: Resource, id: string | number) => Promise<
  { available: false } | { available: true; metadata: Manifest; data: CatalogRecord | null }
>;
const lookup: Lookup = async (era, resource, id) => {
  const [{ getDb }, { createMongoReader, PUBLIC_DATABASE }] = await Promise.all([
    import('../services/mongodb'), import('./mongo-store.ts'),
  ]);
  return createMongoReader(await getDb(PUBLIC_DATABASE))(era, resource, id);
};
export function createCatalogHandler(resource: Resource, read: Lookup = lookup, fixedEra?: string) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    }
    const era = fixedEra ?? req.query.era;
    const id = parseId(resource, req.query.id);
    if (!isEra(era) || id === null) return res.status(400).json({ error: 'INVALID_LOOKUP' });
    try {
      const result = await read(era, resource, id);
      if (!result.available) return res.status(503).json({ error: 'DATASET_UNAVAILABLE', era, resource });
      if (!result.data) return res.status(404).json({ error: 'RECORD_NOT_FOUND', era, resource });
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
      return res.status(200).json({ data: result.data, dataset: result.metadata });
    } catch {
      return res.status(503).json({ error: 'DATASET_UNAVAILABLE', era, resource });
    }
  };
}
