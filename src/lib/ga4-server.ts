import crypto from 'crypto'

type Ga4EventParams = Record<string, string | number | boolean>

const measurementId =
  process.env.GA4_MEASUREMENT_ID ?? process.env.NEXT_PUBLIC_GA_ID
const apiSecret = process.env.GA4_API_SECRET
const debugEnabled = process.env.GA4_DEBUG === 'true'

const canTrackServerSide = () => !!measurementId && !!apiSecret

const createClientId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}.${Math.floor(Math.random() * 1_000_000_000)}`
}

export const sendGa4ServerEvent = async (
  name: string,
  params: Ga4EventParams,
) => {
  if (!canTrackServerSide()) return

  const payload = {
    client_id: createClientId(),
    events: [
      {
        name,
        params: debugEnabled ? { ...params, debug_mode: true } : params,
      },
    ],
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Best-effort only; never block API responses.
  }
}

export const trackApiRequest = async (params: {
  apiRoute: string
  method: string
  status: number
  latencyMs: number
  resourceType?: string
  db?: string
}) => {
  const eventParams: Ga4EventParams = {
    api_route: params.apiRoute,
    method: params.method,
    status: params.status,
    latency_ms: params.latencyMs,
  }

  if (params.resourceType) eventParams.resource_type = params.resourceType
  if (params.db) eventParams.db = params.db

  await sendGa4ServerEvent('api_request', eventParams)
}
