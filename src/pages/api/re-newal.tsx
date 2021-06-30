import { NextApiRequest, NextApiResponse } from 'next'
import { mongo } from '../../services/mongodb'

const reNewal = async (req: NextApiRequest, res: NextApiResponse) => {
  const reNewal = await mongo('re-newal')
  res.status(200).json({ reNewal })
}

export default reNewal
