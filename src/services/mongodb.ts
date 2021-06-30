import { MongoClient } from 'mongodb';

import dotenv from 'dotenv';

dotenv.config();

async function findMonsters(client: MongoClient, dbName: string) {
  const databasesList = await client
    .db(dbName)
    .collection('monsters')
    .find({
      monster_id: { $gte: 1000 },
    });

  const result = await databasesList.toArray();

  return result;
}

// eslint-disable-next-line import/prefer-default-export
export async function mongo(dbName) {
  const client = new MongoClient(process.env.MONGODB);
  let monsters = [];

  try {
    await client.connect();
    monsters = await findMonsters(client, dbName);
  } catch (error) {
    console.log(error);
  } finally {
    await client.close;
  }

  return monsters;
}

