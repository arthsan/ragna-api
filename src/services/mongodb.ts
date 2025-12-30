import { Db, MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB;
if (!mongoUri) {
  throw new Error('Missing MONGODB environment variable');
}

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
  connectCalls: number;
  connectedLogEmitted: boolean;
  shutdownHookRegistered: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined;
}

const cached: MongoCache =
  globalThis._mongoCache ?? {
    client: null,
    promise: null,
    connectCalls: 0,
    connectedLogEmitted: false,
    shutdownHookRegistered: false,
  };

if (!globalThis._mongoCache) {
  globalThis._mongoCache = cached;
}

const clientOptions = {
  maxPoolSize: 20,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

async function connectClient() {
  if (!cached.promise) {
    cached.connectCalls += 1;
    const client = new MongoClient(mongoUri, clientOptions);
    cached.promise = client.connect().then((connectedClient) => {
      cached.client = connectedClient;
      if (!cached.connectedLogEmitted) {
        console.info('Mongo connected');
        cached.connectedLogEmitted = true;
      }
      return connectedClient;
    });
  }

  return cached.promise;
}

function registerShutdownHooks() {
  if (cached.shutdownHookRegistered || typeof process === 'undefined') {
    return;
  }

  cached.shutdownHookRegistered = true;
  const shutdown = async () => {
    if (!cached.client) return;
    try {
      await cached.client.close();
      console.info('Mongo client closed');
    } catch (error) {
      console.error('Mongo close failed', error);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

registerShutdownHooks();

export async function getClient() {
  if (cached.client) return cached.client;
  return connectClient();
}

export async function getDb(dbName: string) {
  const client = await getClient();
  return client.db(dbName);
}

export function getMongoConnectCalls() {
  return cached.connectCalls;
}

function normalizeQueryValue(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function findMonster(db: Db, monster: string | string[]) {
  const monsterId = Number(normalizeQueryValue(monster));
  if (Number.isNaN(monsterId)) return [];

  const databasesList = await db.collection('monsters').find({
    monster_id: { $eq: monsterId },
  });

  const result = await databasesList.toArray();

  return result;
}

export async function getMonster(db: Db, monster: string | string[]) {
  let monsters = [];

  try {
    monsters = await findMonster(db, monster);
  } catch (error) {
    console.log(error);
  }

  return monsters;
}

async function findItem(db: Db, item: string | string[]) {
  const itemId = Number(normalizeQueryValue(item));
  if (Number.isNaN(itemId)) return [];

  const databasesList = await db.collection('items').find({
    id: { $eq: itemId },
  });

  const result = await databasesList.toArray();

  return result;
}

export async function getItems(db: Db, item: string | string[]) {
  let items = [];

  try {
    items = await findItem(db, item);
  } catch (error) {
    console.log(error);
  }

  return items;
}
