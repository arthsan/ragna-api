import { NextApiRequest, NextApiResponse } from 'next'
import { getMonster, mongoConnect } from '../../../../../services/mongodb'

const reNewal = async (req: NextApiRequest, res: NextApiResponse) => {
  const { client } = await mongoConnect()
  const { monster } = req.query

  const reNewal = await getMonster(client, 're-newal', monster)
  res.status(200).json(reNewal[0])
}

export default reNewal
