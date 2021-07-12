import { MongoClient } from 'mongodb';

import dotenv from 'dotenv';

dotenv.config();

declare global {
  namespace NodeJS {
    interface Global {
      mongo: any;
    }
  }
}

// eslint-disable-next-line
let cached = global.mongo;
if (!cached) cached = global.mongo = {};

export async function mongoConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const conn: any = {};
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    cached.promise = MongoClient.connect(process.env.MONGODB, opts)
      .then((client) => {
        conn.client = client;
        return client;
      })
      .then((db) => {
        conn.db = db;
        cached.conn = conn;
      });
  }

  await cached.promise;
  return cached.conn;
}

async function findMonster(
  client: MongoClient,
  dbName: string,
  monster: string
) {
  const databasesList = await client
    .db(dbName)
    .collection('monsters')
    .find({
      monster_id: { $eq: Number(monster) },
    });

  const result = await databasesList.toArray();

  return result;
}

export async function getMonster(client, dbName, monster) {
  let monsters = [];

  try {
    monsters = await findMonster(client, dbName, monster);
  } catch (error) {
    console.log(error);
  }

  return monsters;
}
