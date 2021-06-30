import { NextApiRequest, NextApiResponse } from 'next'
import { mongo } from '../../services/mongodb'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const oldTimes = await mongo('old-times')
  res.status(200).json({ oldTimes })
}
