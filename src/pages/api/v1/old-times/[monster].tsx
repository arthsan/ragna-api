import { NextApiRequest, NextApiResponse } from 'next'
import { getMonster, mongoConnect } from '../../../../services/mongodb'


const oldTimes = async (req: NextApiRequest, res: NextApiResponse) => {
  const {client} = await mongoConnect();
  const { monster } = req.query

  const oldTimes = await getMonster(client, 'old-times', monster);
  res.status(200).json({ oldTimes })
}

export default oldTimes
