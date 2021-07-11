import { NextApiRequest, NextApiResponse } from 'next'
import { getMonster, mongoConnect } from '../../../../services/mongodb'


const reStart = async (req: NextApiRequest, res: NextApiResponse) => {
  const {client} = await mongoConnect();
  const { monster } = req.query

  const reStart = await getMonster(client, 're-start', monster);
  res.status(200).json({ reStart })
}

export default reStart
