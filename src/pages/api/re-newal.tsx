import { NextApiRequest, NextApiResponse } from 'next'
import { mongo } from '../../services/mongodb'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const reNewal = await mongo('re-newal')
  res.status(200).json({ reNewal })
}
