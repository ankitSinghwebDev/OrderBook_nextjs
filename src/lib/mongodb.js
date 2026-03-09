import mongoose from 'mongoose';
import { MongoClient, ServerApiVersion } from 'mongodb';

const FALLBACK_URI = 'mongodb://localhost:27017/purchase_order_db';
const MONGODB_URI = process.env.MONGODB_URI || FALLBACK_URI;
const IS_PROD = process.env.NODE_ENV === 'production';

// Prefer explicit env db, else use db name from URI path, else fallback
let uriDbName = null;
try {
  const parsed = new URL(MONGODB_URI);
  uriDbName = parsed.pathname.replace('/', '') || null;
} catch (err) {
  uriDbName = null;
}

const MONGODB_DB = process.env.MONGODB_DB || uriDbName || 'purchase_order_db';

if (!process.env.MONGODB_URI && !IS_PROD) {
  console.warn('[mongodb] MONGODB_URI not set; using local fallback:', FALLBACK_URI);
}

mongoose.set('strictQuery', true);

// --- Mongoose singleton (for models) ---
let mongoosePromise = globalThis._mongoosePromise;
let mongooseConn = globalThis._mongooseConn;

export async function connectDB() {
  if (!process.env.MONGODB_URI && IS_PROD) {
    throw new Error('MONGODB_URI is required in production at runtime');
  }
  if (mongooseConn) return mongooseConn;
  if (!mongoosePromise) {
    mongoosePromise = mongoose
      .connect(MONGODB_URI, {
        dbName: MONGODB_DB,
        bufferCommands: false,
      })
      .then((m) => m);
    globalThis._mongoosePromise = mongoosePromise;
  }
  mongooseConn = await mongoosePromise;
  globalThis._mongooseConn = mongooseConn;
  return mongooseConn;
}

// --- Native MongoClient with Stable API (optional direct driver access) ---
let mongoClientPromise = globalThis._mongoClientPromise;
let mongoClient = globalThis._mongoClient;

export async function getMongoClient() {
  if (mongoClient) return mongoClient;
  if (!mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      dbName: MONGODB_DB,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    mongoClientPromise = client.connect().then(() => client);
    globalThis._mongoClientPromise = mongoClientPromise;
  }
  mongoClient = await mongoClientPromise;
  globalThis._mongoClient = mongoClient;
  return mongoClient;
}
