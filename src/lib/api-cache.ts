import { NextApiResponse } from 'next'

export const setApiCache = (res: NextApiResponse) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600')
}
