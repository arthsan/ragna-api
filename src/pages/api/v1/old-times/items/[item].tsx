import { NextApiRequest, NextApiResponse } from 'next'
import useGTM from '../../../../../hooks/googleTagManager'
import { getItems, mongoConnect } from '../../../../../services/mongodb'

const oldTimes = async (req: NextApiRequest, res: NextApiResponse) => {
  const { client } = await mongoConnect()
  const { item } = req.query

  const oldTimes = await getItems(client, 'old-times', item)
  res.status(200).json(oldTimes[0])
}

export default oldTimes
