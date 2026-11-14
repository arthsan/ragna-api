/** @typedef {'monsters' | 'items'} Resource */
/** @typedef {{era: string, id: number}} LookupArguments */

export const ERAS = Object.freeze({
  monsters: Object.freeze(['old-times', 're-newal', 're-start']),
  items: Object.freeze(['old-times', 're-newal']),
});

export class LookupError extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** @param {Resource} resource @param {unknown} args @returns {LookupArguments} */
export function validateArguments(resource, args) {
  if (!isObject(args) || Object.keys(args).length !== 2 ||
      !Object.hasOwn(args, 'era') || !Object.hasOwn(args, 'id') ||
      typeof args.era !== 'string' || !ERAS[resource].includes(args.era) ||
      typeof args.id !== 'number' || !Number.isSafeInteger(args.id) || args.id < 1) {
    throw new LookupError('INVALID_ARGUMENTS',
      `Use exactly {era, id}: era must be one of ${ERAS[resource].join(', ')}; id must be a positive safe integer.`);
  }
  return { era: args.era, id: args.id };
}

/** @param {string} value */
function validateOrigin(value) {
  const url = new URL(value);
  const production = url.protocol === 'https:' && url.hostname === 'ragnapi.com' && !url.port;
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((!production && !local) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('RAGNA_API_ORIGIN must be https://ragnapi.com or an HTTP loopback origin, without credentials, paths, query or fragment.');
  }
  return url.origin;
}

/** @param {Response} response @param {number} limit @returns {Promise<unknown>} */
async function readRecord(response, limit) {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new LookupError('RESPONSE_TOO_LARGE', 'API response exceeded the byte limit.');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    if (!text.trim()) return null;
    return JSON.parse(text);
  } catch {
    throw new LookupError('INVALID_RESPONSE', 'API returned invalid UTF-8 JSON.');
  }
}

/**
 * The operator configures the origin once; tool arguments never contain a URL.
 * @param {{origin?: string, fetchImpl?: typeof fetch, timeoutMs?: number,
 * maxResponseBytes?: number, minIntervalMs?: number, now?: () => number}} [options]
 */
export function createApiClient({
  origin = 'https://ragnapi.com', fetchImpl = globalThis.fetch,
  timeoutMs = 8000, maxResponseBytes = 1024 * 1024,
  minIntervalMs = 1000, now = Date.now,
} = {}) {
  const apiOrigin = validateOrigin(origin);
  let nextLookupAt = 0;

  /** @param {Resource} resource @param {unknown} args */
  return async function lookup(resource, args) {
    const { era, id } = validateArguments(resource, args);
    if (now() < nextLookupAt) {
      throw new LookupError('RATE_LIMITED', 'Wait at least one second between lookups.');
    }
    nextLookupAt = now() + minIntervalMs;
    const apiPath = `/api/v1/${era}/${resource}/${id}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${apiOrigin}${apiPath}`, {
        method: 'GET', headers: { accept: 'application/json' },
        redirect: 'error', credentials: 'omit', signal: controller.signal,
      });
      if (response.status === 404 || response.status === 204) {
        await response.body?.cancel();
        throw new LookupError('NO_RECORD', 'API returned no record. Dataset coverage is unknown.');
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new LookupError('UPSTREAM_UNAVAILABLE', 'API request failed. Try again later.');
      }
      if (response.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
        await response.body?.cancel();
        throw new LookupError('INVALID_RESPONSE', 'API must return application/json.');
      }
      const record = await readRecord(response, maxResponseBytes);
      if (record === null) {
        throw new LookupError('NO_RECORD',
          'API returned no record. This may also reflect an upstream query failure; dataset coverage is unknown.');
      }
      const idField = resource === 'monsters' ? 'monster_id' : 'id';
      if (!isObject(record) || record[idField] !== id) {
        throw new LookupError('INVALID_RESPONSE', 'API must return a single object matching the requested ID.');
      }
      return {
        resource, era, id, record,
        provenance: { apiUrl: `${apiOrigin}${apiPath}`, datasetVersion: null,
          sourceVerified: false, coverage: 'unknown' },
      };
    } catch (error) {
      if (error instanceof LookupError) throw error;
      if (controller.signal.aborted) {
        throw new LookupError('UPSTREAM_TIMEOUT', 'API request timed out.');
      }
      throw new LookupError('UPSTREAM_UNAVAILABLE', 'API request failed. Try again later.');
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  };
}
