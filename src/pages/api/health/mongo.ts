import type { NextApiRequest, NextApiResponse } from 'next'
import { getClient, getMongoConnectCalls } from '../../../services/mongodb'
import { setApiCache } from 'lib/api-cache'
import { withApiAnalytics } from 'lib/api-analytics'

type HealthResponse = {
  connectCalls: number
  isConnected: boolean
}

async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  const client = await getClient()
  let isConnected = false
  try {
    await client.db().command({ ping: 1 })
    isConnected = true
  } catch {
    isConnected = false
  }

  setApiCache(res)
  res.status(200).json({
    connectCalls: getMongoConnectCalls(),
    isConnected,
  })
}

export default withApiAnalytics(handler, { resourceType: 'health' })
