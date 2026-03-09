import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Prefer .env.local (Next.js convention) but fall back to .env
const envPath = process.env.ENV_PATH || '.env.local';
const result = dotenv.config({ path: envPath });
if (result.error) {
  dotenv.config();
}

const uri = process.env.MONGODB_URI;
const sourceDbName = process.env.LEGACY_DB || 'test';
const targetDbName = process.env.MONGODB_DB || 'purchase_order_db';
const collectionName = 'users';

if (!uri) {
  console.error('MONGODB_URI is not set. Please define it in .env.local');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();

  const sourceDb = client.db(sourceDbName);
  const targetDb = client.db(targetDbName);
  const sourceColl = sourceDb.collection(collectionName);
  const targetColl = targetDb.collection(collectionName);

  const total = await sourceColl.countDocuments();
  console.log(`Found ${total} documents in ${sourceDbName}.${collectionName}`);

  let migrated = 0;
  const cursor = sourceColl.find();
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    await targetColl.replaceOne({ _id: doc._id }, doc, { upsert: true });
    migrated += 1;
    if (migrated % 100 === 0) {
      console.log(`Migrated ${migrated}/${total}`);
    }
  }

  console.log(`Migration complete. ${migrated} documents written to ${targetDbName}.${collectionName}`);
  await client.close();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
