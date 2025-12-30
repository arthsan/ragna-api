import { NextApiRequest, NextApiResponse } from 'next'
import { getDb, getMonster } from '../../../../../services/mongodb'
import { setApiCache } from 'lib/api-cache'

const reNewal = async (req: NextApiRequest, res: NextApiResponse) => {
  const { monster } = req.query
  const db = await getDb('re-newal')

  const reNewal = await getMonster(db, monster)
  setApiCache(res)
  res.status(200).json(reNewal[0])
}

export default reNewal
