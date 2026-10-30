import { randomUUID } from "node:crypto";
import { storeContact } from "../../src/shared/storeDefaults.js";
import { db, mongoOptions } from "./mongo.js";
export { db, client, tx, findOne, findMany, count, insert, update, deleteMany } from "./mongo.js";
export const now = () => new Date().toISOString();
export async function all(c) {
  const docs = await db.collection(c).find({}, mongoOptions()).sort({
    _id: -1
  }).toArray();
  return docs.map(({
    _id,
    ...d
  }) => d);
}
export async function get(c, id) {
  const d = await db.collection(c).findOne({
    id
  }, mongoOptions());
  if (!d) return null;
  const {
    _id,
    ...data
  } = d;
  return data;
}
export async function put(c, d) {
  d = {
    ...d,
    id: d.id || randomUUID(),
    updatedAt: now()
  };
  await db.collection(c).replaceOne({
    id: d.id
  }, d, {
    ...mongoOptions(),
    upsert: true
  });
  return d;
}
export const remove = (c, id) => db.collection(c).deleteOne({
  id
}, mongoOptions());
export const audit = async (u, action) => await put("audit", {
  userId: u.id,
  action,
  createdAt: now()
});
async function seed(c, d) {
  await db.collection(c).updateOne({ id: d.id }, { $setOnInsert: { ...d, updatedAt: now() } }, { upsert: true });
}
await seed("settings", {
  id: "store",
  brand: "Dr. Yogitha's",
  description: "Ayurvedic hair oil inspired by botanical traditions.",
  ...storeContact,
  shippingPaise: 0,
  seoTitle: "Dr. Yogitha's — Ayurvedic Hair Oil",
  seoDescription: "A mindful botanical hair-care ritual.",
  socialImage: "/product-showcase.webp"
});
await seed("products", {
  id: "hair-oil",
  name: "Ayurvedic Hair Oil",
  slug: "ayurvedic-hair-oil",
  sku: "AYU-001",
  description: "A golden botanical hair oil inspired by Ayurvedic traditions.",
  pricePaise: 0,
  stock: 0,
  status: "draft",
  image: "/product-showcase.webp",
  weight: 0,
  length: 0,
  breadth: 0,
  height: 0,
  faq: []
});
for (const [slug, title] of [["privacy", "Privacy policy"], ["terms", "Terms & conditions"], ["shipping", "Shipping policy"], ["returns", "Returns & refunds"]]) await seed("policies", {
  id: slug,
  slug,
  title,
  content: "",
  status: "draft"
});
