import { randomBytes, createHash } from "node:crypto";
import { db, mongoOptions, tx } from "./mongo.js";
import { get } from "./db.js";
import { check, text } from "./validate.js";
import { productForSize } from "../../src/shared/productOptions.js";

function cartId(req, res) {
  let token = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("cart="))?.slice(5);
  if (!/^[a-f0-9]{64}$/.test(token || "")) {
    token = randomBytes(32).toString("hex");
    res.setHeader("Set-Cookie", `cart=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  }
  return createHash("sha256").update(token).digest("hex");
}

export function cartIdentifier(req) {
  const token = (req.headers.cookie || "")
    .split(";")
    .map(v => v.trim())
    .find(v => v.startsWith("cart="))
    ?.slice(5);
  return /^[a-f0-9]{64}$/.test(token || "")
    ? createHash("sha256").update(token).digest("hex")
    : null;
}

async function view(lines) {
  const items = [];
  for (const line of lines) {
    const p = productForSize(await get("products", line.productId), line.variantId || "50ml");
    const available = !!p && p.status === "active" && p.stock >= line.quantity && p.pricePaise > 0;
    items.push({ productId: line.productId, variantId: line.variantId || "50ml", sizeLabel: p?.sizeLabel, quantity: line.quantity,
      name: p ? `${p.name} · ${p.sizeLabel}` : "Unavailable product", slug: p?.slug, image: p?.image || "",
      pricePaise: p?.pricePaise || 0, stock: p?.status === "active" ? p.stock : 0,
      available, totalPaise: (p?.pricePaise || 0) * line.quantity });
  }
  return { items, count: items.reduce((n, p) => n + p.quantity, 0),
    subtotalPaise: items.reduce((n, p) => n + p.totalPaise, 0) };
}

export async function cart(req, res, body) {
  const id = cartId(req, res);
  const collection = db.collection("carts");
  if (req.method === "GET") return view((await collection.findOne({ _id: id }))?.items || []);
  check(["POST", "PATCH", "DELETE"].includes(req.method), "Method not allowed", 405);
  const productId = text(body.productId, 100);
  const variantId = body.variantId || "50ml";
  check(["50ml", "100ml"].includes(variantId), "Choose 50 ml or 100 ml");
  const matches = p => p.productId === productId && (p.variantId || "50ml") === variantId;
  check(productId, "Product required");
  const quantity = req.method === "DELETE" ? 0 : body.quantity;
  check(Number.isSafeInteger(quantity) && quantity >= (req.method === "POST" ? 1 : 0) && quantity <= 20, "Quantity must be between 0 and 20");
  await collection.updateOne({ _id: id }, { $setOnInsert: { items: [], expires: new Date(Date.now() + 2592000000) } }, { upsert: true });
  return tx(async () => {
    const current = await collection.findOne({ _id: id }, mongoOptions());
    const items = current.items;
    const existing = items.find(matches);
    const next = req.method === "POST" ? (existing?.quantity || 0) + quantity : quantity;
    if (next > 0) {
      const p = productForSize(await get("products", productId), variantId);
      check(p?.status === "active" && p.pricePaise > 0, "Product unavailable", 409);
      check(next <= 20 && next <= p.stock, "No more stock available for this product", 409);
      check(existing || items.length < 50, "Your bag has reached its item limit");
    }
    const updated = items.filter(p => !matches(p));
    if (next) updated.push({ productId, variantId, quantity: next });
    await collection.updateOne({ _id: id }, { $set: { items: updated, expires: new Date(Date.now() + 2592000000) } }, mongoOptions());
    return view(updated);
  });
}

// Called inside the order transaction, only when a new order is created.
export async function consumeCart(req, productId, quantity, variantId = "50ml") {
  return consumeCartById(cartIdentifier(req), productId, quantity, variantId);
}

export async function consumeCartById(id, productId, quantity, variantId = "50ml") {
  if (!id) return;
  const collection = db.collection("carts");
  const current = await collection.findOne({ _id: id }, mongoOptions());
  if (!current) return;
  const items = current.items.map(p => p.productId === productId && (p.variantId || "50ml") === variantId ? { ...p, quantity: Math.max(0, p.quantity - quantity) } : p).filter(p => p.quantity);
  await collection.updateOne({ _id: id }, { $set: { items } }, mongoOptions());
}
