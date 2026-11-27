import { storeContact } from "../../src/shared/storeDefaults.js";

const idCollections = [
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
];

async function seed(db, collection, document) {
  const timestamp = new Date().toISOString();
  await db.collection(collection).updateOne(
    { id: document.id },
    {
      $setOnInsert: {
        ...document,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    { upsert: true },
  );
}

export async function ensureSchema(db) {
  for (const name of idCollections)
    await db.collection(name).createIndex({ id: 1 }, { unique: true });

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
  for (const name of ["limits", "carts"])
    await db
      .collection(name)
      .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("orders")
    .createIndex({ userId: 1, idempotencyKey: 1 }, { unique: true });

  const reviews = db.collection("reviews");
  const legacyReviewIndex = (await reviews.indexes()).find(
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
  for (const name of ["products", "posts", "policies", "categories"])
    await db.collection(name).createIndex(
      { slug: 1 },
      {
        unique: true,
        partialFilterExpression: { slug: { $type: "string" } },
      },
    );
  await db.collection("orders").createIndex(
    { razorpayOrderId: 1 },
    {
      unique: true,
      partialFilterExpression: { razorpayOrderId: { $type: "string" } },
      name: "razorpay_order_id_unique",
    },
  );
  await db.collection("payments").createIndex(
    { providerOrderId: 1 },
    {
      unique: true,
      partialFilterExpression: { providerOrderId: { $type: "string" } },
      name: "provider_order_id_unique",
    },
  );
  await db.collection("payments").createIndex(
    { providerPaymentId: 1 },
    {
      unique: true,
      partialFilterExpression: { providerPaymentId: { $type: "string" } },
      name: "provider_payment_id_unique",
    },
  );

  await seed(db, "settings", {
    id: "store",
    brand: "Dr. Yogitha's",
    description: "Ayurvedic hair oil inspired by botanical traditions.",
    ...storeContact,
    shippingPaise: 0,
    seoTitle: "Dr. Yogitha's â€” Ayurvedic Hair Oil",
    seoDescription: "A mindful botanical hair-care ritual.",
    socialImage: "/product-showcase.webp",
  });
  await seed(db, "products", {
    id: "hair-oil",
    name: "Ayurvedic Hair Oil",
    slug: "ayurvedic-hair-oil",
    sku: "AYU-001",
    description:
      "A golden botanical hair oil inspired by Ayurvedic traditions.",
    pricePaise: 0,
    stock: 0,
    status: "draft",
    image: "/product-showcase.webp",
    weight: 0,
    length: 0,
    breadth: 0,
    height: 0,
    faq: [],
  });
  for (const [slug, title] of [
    ["privacy", "Privacy policy"],
    ["terms", "Terms & conditions"],
    ["shipping", "Shipping policy"],
    ["returns", "Returns & refunds"],
  ])
    await seed(db, "policies", {
      id: slug,
      slug,
      title,
      content: "",
      status: "draft",
    });
}
