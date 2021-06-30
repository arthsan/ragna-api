import { NextApiRequest, NextApiResponse } from 'next'
import { mongo } from '../../services/mongodb'

const reStart = async (req: NextApiRequest, res: NextApiResponse) => {
  const reStart = await mongo('re-start')
  res.status(200).json({ reStart })
}

export default reStart
