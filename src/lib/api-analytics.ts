import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { trackApiRequest } from './api-telemetry'

type ApiAnalyticsOptions = {
  resourceType?: string
  db?: string
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
      const method = req.method ?? 'GET'

      void trackApiRequest({
        method,
        status,
        latencyMs: Date.now() - start,
        resourceType: options.resourceType,
        db: options.db,
      })
    }
  }
