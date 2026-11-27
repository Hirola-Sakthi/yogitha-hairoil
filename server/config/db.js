import mongoose from "mongoose";
import { AsyncLocalStorage } from "node:async_hooks";
import { ensureSchema } from "./ensure-schema.js";

const uri = process.env.MONGODB_URI;
if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
  throw new Error(
    "Set MONGODB_URI in server/.env to your MongoDB connection string.",
  );
}

try {
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "dr_yogithas_commerce",
    serverSelectionTimeoutMS: 10000,
    autoIndex: false,
  });
} catch {
  await mongoose.disconnect();
  throw new Error(
    "Cannot connect to MongoDB. Check MongoDB credentials and network access.",
  );
}

export { mongoose };
export const client = mongoose.connection.getClient();
export const db = mongoose.connection.db;

const sessions = new AsyncLocalStorage();
export const mongoOptions = () => ({ session: sessions.getStore() });
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

try {
  const hello = await db.command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid")
    throw new Error(
      "MongoDB must be a replica set or Atlas cluster to support commerce transactions.",
    );
  await ensureSchema(db);
} catch (error) {
  await mongoose.disconnect();
  throw error;
}
