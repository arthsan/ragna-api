/** Operational counts are not audience analytics. Never send API calls to GA4. */
const databases = new Set(['old-times', 're-newal', 're-start'])
const resources = new Set(['items', 'monsters', 'skills', 'maps', 'vendors', 'health'])
const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

type ApiRequestMetrics = {
  method: string
  status: number
  latencyMs: number
  resourceType?: string
  db?: string
}

/** Fixed labels only: no URL, query, headers, cookies, IP, body or user identifiers. */
export const trackApiRequest = (params: ApiRequestMetrics): void => {
  if (process.env.API_TELEMETRY_ENABLED === 'false') return

  try {
    const resource = resources.has(params.resourceType) ? params.resourceType : 'other'
    const db = databases.has(params.db) ? params.db : 'other'
    const route = resource === 'health'
      ? '/api/health'
      : db !== 'other' && resource !== 'other'
        ? `/api/v1/${db}/${resource}/:id`
        : '/api/other'

    console.info(JSON.stringify({
      event: 'api_request',
      schema_version: 1,
      api_route: route,
      method: methods.has(params.method) ? params.method : 'OTHER',
      status: Number.isInteger(params.status) && params.status >= 100 && params.status <= 599
        ? params.status : 0,
      latency_ms: Number.isFinite(params.latencyMs)
        ? Math.max(0, Math.round(params.latencyMs)) : 0,
      resource_type: resource,
      db,
    }))
  } catch {
    // Logging failures must never mask a handler error or fail a successful API call.
  }
}
