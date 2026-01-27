import { NextApiRequest, NextApiResponse } from 'next'
import { getDb, getMonster } from '../../../../../services/mongodb'
import { setApiCache } from 'lib/api-cache'
import { withApiAnalytics } from 'lib/api-analytics'


const oldTimes = async (req: NextApiRequest, res: NextApiResponse) => {
  const { monster } = req.query
  const db = await getDb('old-times')

  const oldTimes = await getMonster(db, monster)
  setApiCache(res)
  res.status(200).json(oldTimes[0])
}

export default withApiAnalytics(oldTimes, {
  resourceType: 'monsters',
  db: 'old-times',
})
