import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { trackApiRequest } from 'lib/ga4-server'

type ApiAnalyticsOptions = {
  resourceType?: string
  db?: string
}

const getRoutePath = (req: NextApiRequest) => {
  if (!req.url) return ''
  return req.url.split('?')[0] ?? ''
}

export const withApiAnalytics =
  (handler: NextApiHandler, options: ApiAnalyticsOptions = {}) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now()
    let status = res.statusCode

    try {
      await handler(req, res)
      status = res.statusCode
    } catch (error) {
      status = res.statusCode >= 400 ? res.statusCode : 500
      throw error
    } finally {
      const apiRoute = getRoutePath(req)
      const method = req.method ?? 'GET'

      void trackApiRequest({
        apiRoute,
        method,
        status,
        latencyMs: Date.now() - start,
        resourceType: options.resourceType,
        db: options.db,
      })
    }
  }
