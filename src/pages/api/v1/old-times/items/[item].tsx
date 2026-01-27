import { NextApiRequest, NextApiResponse } from 'next'
import { getDb, getItems } from '../../../../../services/mongodb'
import { setApiCache } from 'lib/api-cache'
import { withApiAnalytics } from 'lib/api-analytics'

const oldTimes = async (req: NextApiRequest, res: NextApiResponse) => {
  const { item } = req.query
  const db = await getDb('old-times')

  const oldTimes = await getItems(db, item)
  setApiCache(res)
  res.status(200).json(oldTimes[0])
}

export default withApiAnalytics(oldTimes, {
  resourceType: 'items',
  db: 'old-times',
})
