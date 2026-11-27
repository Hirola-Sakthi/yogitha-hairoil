import { randomUUID } from "node:crypto";
import { db, mongoOptions } from "../config/db.js";
import { modelFor } from "./index.js";

export { db, client, tx, mongoOptions } from "../config/db.js";

export const now = () => new Date().toISOString();

const options = () => {
  const session = mongoOptions().session;
  return session ? { session } : {};
};

const clean = (document) => {
  if (!document) return null;
  const data =
    typeof document.toObject === "function" ? document.toObject() : document;
  const { _id, __v, ...record } = data;
  return record;
};

const model = (name) => {
  const collection = modelFor(name);
  if (!collection) throw new Error(`No Mongoose model registered for ${name}`);
  return collection;
};

const withSession = (query) => {
  const session = mongoOptions().session;
  return session ? query.session(session) : query;
};

export const findOne = async (name, filter) =>
  clean(await withSession(model(name).findOne(filter)).lean());

export const findMany = async (name, filter = {}) => {
  const records = await withSession(model(name).find(filter))
    .sort({ _id: -1 })
    .lean();
  return records.map(clean);
};

export const count = (name, filter = {}) =>
  withSession(model(name).countDocuments(filter)).exec();

export async function insert(name, data) {
  const [record] = await model(name).create([{ ...data }], options());
  return clean(record);
}

export const update = (name, filter, changes) =>
  model(name).updateOne(filter, { $set: changes }, options()).exec();

export const deleteMany = (name, filter) =>
  model(name).deleteMany(filter, options()).exec();

export async function all(collection) {
  return findMany(collection);
}

export async function get(collection, id) {
  return findOne(collection, { id });
}

export async function put(collection, document) {
  const record = {
    ...document,
    id: document.id || randomUUID(),
    updatedAt: now(),
  };
  await model(collection)
    .replaceOne({ id: record.id }, record, {
      ...options(),
      upsert: true,
      runValidators: true,
    })
    .exec();
  return record;
}

export const remove = (collection, id) =>
  model(collection).deleteOne({ id }, options()).exec();

export const audit = async (account, action) =>
  put("audit", {
    userId: account.id,
    action,
    createdAt: now(),
  });
