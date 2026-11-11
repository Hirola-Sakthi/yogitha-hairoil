import { MongoClient } from "mongodb";
import { AsyncLocalStorage } from "node:async_hooks";

const uri = process.env.MONGODB_URI;
if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
  throw new Error(
    "Set MONGODB_URI in server/.env to your MongoDB connection string.",
  );
}
export const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
} catch {
  await client.close();
  throw new Error(
    "Cannot connect to MongoDB. Check MONGODB_URI, database credentials and network access.",
  );
}
export const db = client.db(process.env.MONGODB_DB || "ambar_commerce");
const sessions = new AsyncLocalStorage();
const options = () => ({ session: sessions.getStore() });
const clean = (doc) => {
  if (!doc) return null;
  const { _id, ...data } = doc;
  return data;
};
export const findOne = async (name, filter) =>
  clean(await db.collection(name).findOne(filter, options()));
export const findMany = async (name, filter = {}) =>
  (
    await db
      .collection(name)
      .find(filter, options())
      .sort({ _id: -1 })
      .toArray()
  ).map(clean);
export const count = (name, filter = {}) =>
  db.collection(name).countDocuments(filter, options());
export async function insert(name, data) {
  await db.collection(name).insertOne({ ...data }, options());
  return data;
}
export const update = (name, filter, changes) =>
  db.collection(name).updateOne(filter, { $set: changes }, options());
export const deleteMany = (name, filter) =>
  db.collection(name).deleteMany(filter, options());
export async function tx(fn) {
  if (sessions.getStore()) return fn();
  const session = client.startSession();
  try {
    return await session.withTransaction(() => sessions.run(session, fn), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });
  } finally {
    await session.endSession();
  }
}
export const mongoOptions = options;

try {
  const hello = await db.command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid") {
    throw new Error(
      "MongoDB must be a replica set or Atlas cluster to support commerce transactions.",
    );
  }
  for (const name of [
    "settings",
    "products",
    "policies",
    "posts",
    "categories",
    "reviews",
    "leads",
    "orders",
    "payments",
    "refunds",
    "audit",
    "webhooks",
    "users",
  ]) {
    await db.collection(name).createIndex({ id: 1 }, { unique: true });
  }
  await db
    .collection("webhooks")
    .createIndex({ provider: 1, providerEventId: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex(
    { role: 1 },
    {
      unique: true,
      partialFilterExpression: { role: "owner" },
      name: "single_owner",
    },
  );
  for (const name of ["sessions", "resets"]) {
    await db.collection(name).createIndex({ token: 1 }, { unique: true });
    await db.collection(name).createIndex({ userId: 1 });
    await db
      .collection(name)
      .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  }
  await db
    .collection("limits")
    .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("carts")
    .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("orders")
    .createIndex({ userId: 1, idempotencyKey: 1 }, { unique: true });
  const reviews = db.collection("reviews");
  const reviewIndexes = await reviews.indexes();
  const legacyReviewIndex = reviewIndexes.find(
    (index) =>
      index.name === "userId_1_productId_1" && !index.partialFilterExpression,
  );
  if (legacyReviewIndex) await reviews.dropIndex(legacyReviewIndex.name);
  await reviews.createIndex(
    { userId: 1, productId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        userId: { $type: "string" },
        productId: { $type: "string" },
      },
    },
  );
  await db.collection("refunds").createIndex(
    { orderId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        status: { $in: ["requested", "approved", "processed"] },
      },
    },
  );
  for (const name of ["products", "posts", "policies", "categories"]) {
    await db.collection(name).createIndex(
      { slug: 1 },
      {
        unique: true,
        partialFilterExpression: { slug: { $type: "string" } },
      },
    );
  }
} catch (error) {
  await client.close();
  throw error;
}
