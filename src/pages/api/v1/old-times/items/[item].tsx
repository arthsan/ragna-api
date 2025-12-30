import { NextApiRequest, NextApiResponse } from 'next'
import { getDb, getItems } from '../../../../../services/mongodb'
import { setApiCache } from 'lib/api-cache'

const oldTimes = async (req: NextApiRequest, res: NextApiResponse) => {
  const { item } = req.query
  const db = await getDb('old-times')

  const oldTimes = await getItems(db, item)
  setApiCache(res)
  res.status(200).json(oldTimes[0])
}

export default oldTimes
