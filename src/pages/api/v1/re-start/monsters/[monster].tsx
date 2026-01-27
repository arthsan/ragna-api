import { NextApiRequest, NextApiResponse } from 'next'
import { getDb, getMonster } from '../../../../../services/mongodb'
import { setApiCache } from 'lib/api-cache'
import { withApiAnalytics } from 'lib/api-analytics'

const reStart = async (req: NextApiRequest, res: NextApiResponse) => {
  const { monster } = req.query
  const db = await getDb('re-start')

  const reStart = await getMonster(db, monster)
  setApiCache(res)
  res.status(200).json(reStart[0])
}

export default withApiAnalytics(reStart, {
  resourceType: 'monsters',
  db: 're-start',
})
