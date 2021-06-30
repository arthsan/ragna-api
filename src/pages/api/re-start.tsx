import { NextApiRequest, NextApiResponse } from 'next'
import { mongo } from '../../services/mongodb'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const reStart = await mongo('re-start')
  res.status(200).json({ reStart })
}
