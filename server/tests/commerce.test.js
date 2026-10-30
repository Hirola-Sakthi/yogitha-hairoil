import { test, after } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryReplSet } from "mongodb-memory-server";
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = "ambar_test";
process.env.NODE_ENV = "test";
process.env.ALLOW_COD = "true";
process.env.SITE_URL = "http://localhost:5173";
const {
  server
} = await import("../src/index.js");
const {
  db, client, insert, tx, findOne,
  get,
  put,
  all
} = await import("../src/db.js");
const {
  hash, digest, limit
} = await import("../src/auth.js");
await new Promise(r => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port;
let customer = "",
  owner = "",
  editor = "",
  orderId,
  refundId;
async function call(path, method = "GET", body, cookie = "", headers = {}) {
  const r = await fetch(origin + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.get("set-cookie")?.split(";")[0]
  };
}
const address = {
  name: "Test customer",
  phone: "9876543210",
  line1: "Test address",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001"
};
test("Registration, session restoration and privilege escalation prevention", async () => {
  const r = await call("/auth/register", "POST", {
    name: "Tester",
    email: "test@example.com",
    password: "test-long-password",
    role: "owner"
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.role, "customer");
  customer = r.cookie;
  assert.equal((await call("/auth/me", "GET", null, customer)).data.user.email, "test@example.com");
  assert.equal((await call("/admin/orders", "GET", null, customer)).status, 403);
  assert.equal((await call("/auth/login", "POST", {
    email: "test@example.com",
    password: "wrong-password"
  })).status, 401);
});
test("Owner product activation requires confirmed price and protects settings", async () => {
  await insert("users", {
    id: "owner",
    name: "Owner",
    email: "owner@example.com",
    password: hash("owner-long-password"),
    role: "owner",
    active: 1,
    createdAt: new Date().toISOString()
  });
  owner = (await call("/auth/login", "POST", {
    email: "owner@example.com",
    password: "owner-long-password"
  })).cookie;
  assert.equal((await call("/admin/products/hair-oil", "PATCH", {
    status: "active"
  }, owner)).status, 400);
  assert.equal((await call("/admin/products/hair-oil", "PATCH", {
    pricePaise: 69900,
    stock: 8,
    status: "active"
  }, owner)).status, 200);
  assert.equal((await call("/admin/settings", "PATCH", {
    shippingPaise: 5000
  }, owner)).status, 200);
  assert.equal((await call("/admin/settings", "GET", null, customer)).status, 403);
});
test("Checkout checks login, address, stock, authoritative total and idempotency", async () => {
  const b = {
    productId: "hair-oil",
    quantity: 2,
    paymentMethod: "cod",
    address,
    idempotencyKey: "test-checkout-unique-1",
    totalPaise: 1
  };
  assert.equal((await call("/orders", "POST", b)).status, 401);
  assert.equal((await call("/orders", "POST", {
    ...b,
    address: {
      ...address,
      pincode: "bad"
    }
  }, customer)).status, 400);
  const r = await call("/orders", "POST", b, customer);
  assert.equal(r.status, 200);
  orderId = r.data.id;
  assert.equal(r.data.totalPaise, 144800);
  assert.equal((await get("products", "hair-oil")).stock, 6);
  assert.equal((await call("/orders", "POST", b, customer)).data.id, orderId);
  assert.equal((await all("orders")).length, 1);
  assert.equal((await get("products", "hair-oil")).stock, 6);
  assert.equal((await call("/orders", "POST", {
    ...b,
    quantity: 20,
    idempotencyKey: "test-checkout-unique-2"
  }, customer)).status, 409);
});
test("Customer order isolation and refund ownership", async () => {
  const other = (await call("/auth/register", "POST", {
    name: "Other",
    email: "other@example.com",
    password: "other-long-password"
  })).cookie;
  assert.equal((await call("/orders", "GET", null, other)).data.length, 0);
  assert.equal((await call("/refunds", "POST", {
    orderId,
    reason: "not mine"
  }, other)).status, 404);
});
test("Order lifecycle and COD collection require valid transitions and delivery", async () => {
  assert.equal((await call("/admin/orders/" + orderId, "PATCH", {
    status: "delivered"
  }, owner)).status, 400);
  for (const status of ["confirmed", "processing"]) assert.equal((await call("/admin/orders/" + orderId, "PATCH", {
    status
  }, owner)).status, 200);
  assert.equal((await call("/admin/payments/PAY-" + orderId, "PATCH", {
    status: "paid",
    reference: "receipt"
  }, owner)).status, 400);
  await put("orders", {
    ...(await get("orders", orderId)),
    shipment: {
      awb: "TEST-ONLY"
    }
  });
  for (const status of ["shipped", "delivered"]) assert.equal((await call("/admin/orders/" + orderId, "PATCH", {
    status
  }, owner)).status, 200);
  assert.equal((await call("/admin/payments/PAY-" + orderId, "PATCH", {
    status: "paid",
    reference: "cash-receipt-1"
  }, owner)).status, 200);
  assert.equal((await call("/admin/dashboard", "GET", null, owner)).data.revenuePaise, 144800);
});
test("Refund approval, reference enforcement, duplicate prevention and net collections", async () => {
  const r = await call("/refunds", "POST", {
    orderId,
    reason: "Test refund"
  }, customer);
  assert.equal(r.status, 200);
  refundId = r.data.id;
  assert.equal((await call("/refunds", "POST", {
    orderId,
    reason: "duplicate"
  }, customer)).status, 409);
  assert.equal((await call("/admin/refunds/" + refundId, "PATCH", {
    status: "processed",
    reference: "ref"
  }, owner)).status, 400);
  assert.equal((await call("/admin/refunds/" + refundId, "PATCH", {
    status: "approved"
  }, owner)).status, 200);
  assert.equal((await call("/admin/refunds/" + refundId, "PATCH", {
    status: "processed"
  }, owner)).status, 400);
  assert.equal((await call("/admin/refunds/" + refundId, "PATCH", {
    status: "processed",
    reference: "bank-ref-1"
  }, owner)).status, 200);
  assert.equal((await call("/admin/dashboard", "GET", null, owner)).data.revenuePaise, 0);
});
test("Verified-delivery review moderation and public data privacy", async () => {
  const r = await call("/reviews", "POST", {
    productId: "hair-oil",
    rating: 5,
    content: "Test review"
  }, customer);
  assert.equal(r.status, 200);
  assert.equal((await call("/public")).data.reviews.length, 0);
  assert.equal((await call("/admin/reviews/" + r.data.id, "PATCH", {
    status: "approved"
  }, owner)).status, 200);
  const review = (await call("/public")).data.reviews[0];
  assert.equal(review.content, "Test review");
  assert.equal(review.email, undefined);
  assert.equal(review.userId, undefined);
});
test("Editor restrictions and published blog content", async () => {
  assert.equal((await call("/admin/users", "POST", {
    name: "Editor",
    email: "editor@example.com",
    password: "editor-long-password",
    role: "editor"
  }, owner)).status, 200);
  editor = (await call("/auth/login", "POST", {
    email: "editor@example.com",
    password: "editor-long-password"
  })).cookie;
  for (const p of ["orders", "dashboard", "settings", "users", "leads"]) assert.equal((await call("/admin/" + p, "GET", null, editor)).status, 403);
  assert.equal((await call("/admin/posts", "POST", {
    title: "Test article",
    slug: "test-article",
    content: "Helpful content",
    status: "published"
  }, editor)).status, 200);
  assert.equal((await call("/public")).data.posts.length, 1);
  assert.equal((await call("/admin/posts", "POST", {
    title: "Duplicate",
    slug: "test-article",
    status: "draft"
  }, editor)).status, 409);
});
test("Draft policy exclusion, sitemap, server-rendered metadata and 404", async () => {
  assert.equal((await call("/public")).data.policies.length, 0);
  assert.equal((await call("/admin/policies/privacy", "PATCH", {
    content: "Test privacy content",
    status: "published"
  }, owner)).status, 200);
  const map = await (await fetch(origin + "/sitemap.xml")).text();
  assert.match(map, /test-article/);
  assert.match(map, /policies\/privacy/);
  assert.doesNotMatch(map, /\/admin/);
  const html = await (await fetch(origin + "/products/ayurvedic-hair-oil")).text();
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"price":"699.00"/);
  assert.equal((await fetch(origin + "/unknown-page")).status, 404);
  for (const route of ["/cart", "/admin/products/new", "/admin/products/hair-oil"]) {
    const page = await fetch(origin + route);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /noindex, nofollow/);
  }
});
test("CSRF defense, lead validation, missing integrations and session revocation", async () => {
  assert.equal((await call("/leads", "POST", {
    name: "Test",
    email: "test@example.com",
    message: "hello"
  }, customer, {
    Origin: "https://evil.example"
  })).status, 403);
  assert.equal((await call("/leads", "POST", {
    name: "Test",
    email: "bad",
    phone: "9876543210",
    subject: "Question",
    message: "hello"
  })).status, 400);
  assert.equal((await call("/leads", "POST", {
    name: "Test",
    email: "test@example.com",
    message: "hello"
  })).status, 400);
  assert.equal((await call("/leads", "POST", {
    name: "Test",
    email: "test@example.com",
    phone: "9876543210",
    subject: "Question",
    message: "hello"
  })).status, 200);
  assert.equal((await call("/admin/integrations", "GET", null, owner)).data.shiprocket, false);
  await call("/auth/logout", "POST", {}, customer);
  assert.equal((await call("/auth/me", "GET", null, customer)).data.user, null);
});
test("MongoDB transactions roll back related writes together", async () => {
  const before = await get("products", "hair-oil");
  await assert.rejects(tx(async () => {
    await put("products", { ...before, stock: 999 });
    await put("orders", { id: "rollback-order", userId: "test", idempotencyKey: "rollback" });
    throw new Error("abort-test");
  }), /abort-test/);
  assert.equal((await get("products", "hair-oil")).stock, before.stock);
  assert.equal(await get("orders", "rollback-order"), null);
});

test("Concurrent checkout is idempotent and never oversells", async () => {
  const cookie = (await call("/auth/login", "POST", {
    email: "test@example.com", password: "test-long-password",
  })).cookie;
  const product = await get("products", "hair-oil");
  await put("products", { ...product, stock: 5 });
  const body = { productId: product.id, quantity: 1, paymentMethod: "cod", address, idempotencyKey: "concurrent-same-key" };
  const duplicates = await Promise.all(Array.from({ length: 5 }, () => call("/orders", "POST", body, cookie)));
  assert.deepEqual(duplicates.map(r => r.status), [200, 200, 200, 200, 200]);
  assert.equal(new Set(duplicates.map(r => r.data.id)).size, 1);
  assert.equal((await get("products", product.id)).stock, 4);
  await put("products", { ...product, stock: 2 });
  const attempts = await Promise.all(Array.from({ length: 6 }, (_, i) => call("/orders", "POST", {
    ...body, idempotencyKey: "concurrent-stock-" + i,
  }, cookie)));
  assert.equal(attempts.filter(r => r.status === 200).length, 2);
  assert.equal(attempts.filter(r => r.status === 409).length, 4);
  assert.equal((await get("products", product.id)).stock, 0);
});

test("Reset tokens are single use under concurrency and revoke sessions", async () => {
  const account = await findOne("users", { email: "test@example.com" });
  const cookie = (await call("/auth/login", "POST", { email: account.email, password: "test-long-password" })).cookie;
  await insert("resets", { token: digest("reset-test-token"), userId: account.id, expires: new Date(Date.now() + 60000) });
  const results = await Promise.all(Array.from({ length: 2 }, () => call("/auth/reset", "POST", {
    token: "reset-test-token", password: "replacement-long-password",
  })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
  assert.equal((await call("/auth/me", "GET", null, cookie)).data.user, null);
  assert.equal(await findOne("resets", { userId: account.id }), null);
});

test("MongoDB enforces account uniqueness and atomic rate limits", async () => {
  const account = await findOne("users", { role: "owner" });
  await assert.rejects(insert("users", { ...account, id: "other-owner", email: "another@example.com" }), { code: 11000 });
  await assert.rejects(insert("users", { ...account, id: "duplicate-email", role: "customer" }), { code: 11000 });
  const results = await Promise.all(Array.from({ length: 20 }, () => limit("parallel-test", 5)));
  assert.equal(results.filter(Boolean).length, 5);
  await db.collection("limits").updateOne({ _id: "parallel-test" }, { $set: { expires: new Date(0) } });
  assert.equal(await limit("parallel-test", 5), true);
});

test("Admin products and discounts feed the collection; MongoDB carts persist and isolate browsers", async () => {
  const product = { name: "Test botanical oil", slug: "test-botanical-oil", sku: "CART-TEST", description: "Test product",
    pricePaise: 49900, compareAtPricePaise: 69900, stock: 12, status: "active", image: "/product-showcase.webp" };
  const saved = await call("/admin/products", "POST", product, owner);
  assert.equal(saved.status, 200);
  const id = saved.data.id;
  assert.equal((await call("/public")).data.products.find(p => p.id === id).compareAtPricePaise, 69900);
  assert.equal((await call(`/admin/products/${id}`, "PATCH", { compareAtPricePaise: 100 }, owner)).status, 400);
  const initial = await call("/cart");
  const cookie = initial.cookie;
  assert.ok(cookie.startsWith("cart="));
  assert.equal(initial.data.count, 0);
  let result = await call("/cart", "POST", { productId: id, quantity: 2, pricePaise: 1 }, cookie);
  assert.equal(result.status, 200);
  assert.equal(result.data.count, 2);
  assert.equal(result.data.subtotalPaise, 99800);
  assert.equal((await call("/cart", "GET", null, cookie)).data.count, 2);
  assert.equal((await call("/cart")).data.count, 0);
  const adds = await Promise.all(Array.from({ length: 4 }, () => call("/cart", "POST", { productId: id, quantity: 1 }, cookie)));
  assert.ok(adds.every(r => r.status === 200));
  assert.equal((await call("/cart", "GET", null, cookie)).data.count, 6);
  assert.equal((await call("/cart", "POST", { productId: id, quantity: 20 }, cookie)).status, 409);
  assert.equal((await call("/cart", "PATCH", { productId: id, quantity: -1 }, cookie)).status, 400);
  assert.equal((await call("/cart", "GET", null, cookie)).data.count, 6);
  result = await call("/cart", "PATCH", { productId: id, quantity: 3 }, cookie);
  assert.equal(result.data.count, 3);
  const authCookie = (await call("/auth/login", "POST", { email: "other@example.com", password: "other-long-password" })).cookie;
  const order = { productId: id, quantity: 2, paymentMethod: "cod", address, idempotencyKey: "cart-checkout-test-key" };
  assert.equal((await call("/orders", "POST", order, `${authCookie}; ${cookie}`)).status, 200);
  assert.equal((await call("/cart", "GET", null, cookie)).data.count, 1);
  assert.equal((await call("/orders", "POST", order, `${authCookie}; ${cookie}`)).status, 200);
  assert.equal((await call("/cart", "GET", null, cookie)).data.count, 1);
  await call(`/admin/products/${id}`, "PATCH", { status: "archived" }, owner);
  assert.equal((await call("/cart", "GET", null, cookie)).data.items[0].available, false);
  assert.equal((await call("/cart", "POST", { productId: id, quantity: 1 }, cookie)).status, 409);
  assert.equal((await call("/cart", "DELETE", { productId: id }, cookie)).data.count, 0);
});

test("Product image URLs are saved directly without importing them into ImageKit", async () => {
  const originalFetch = globalThis.fetch;
  const oldPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const oldEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const uploadAttempts = [];
  process.env.IMAGEKIT_PRIVATE_KEY = "test-private-key";
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";
  globalThis.fetch = async (input, options) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("https://upload.imagekit.io/")) {
      uploadAttempts.push(url);
      throw new Error("Product image URLs should not be imported.");
    }
    return originalFetch(input, options);
  };
  try {
    const image = "https://example.test/product.webp";
    const image100 = "https://example.test/product-100.webp";
    const saved = await call("/admin/products", "POST", {
      name: "Direct image oil",
      slug: "direct-image-oil",
      sku: "DIRECT-IMAGE",
      pricePaise: 10000,
      stock: 1,
      image,
      image100,
    }, owner);
    assert.equal(saved.status, 200);
    assert.equal(saved.data.image, image);
    assert.equal(saved.data.image100, image100);
    assert.deepEqual(uploadAttempts, []);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldPrivateKey === undefined) delete process.env.IMAGEKIT_PRIVATE_KEY;
    else process.env.IMAGEKIT_PRIVATE_KEY = oldPrivateKey;
    if (oldEndpoint === undefined) delete process.env.IMAGEKIT_URL_ENDPOINT;
    else process.env.IMAGEKIT_URL_ENDPOINT = oldEndpoint;
  }
});

test("50 ml and 100 ml have separate cart lines, prices and stock through checkout and cancellation", async () => {
  const saved = await call("/admin/products", "POST", { name: "Two-size oil", slug: "two-size-oil", sku: "SIZE-TEST", pricePaise: 30000, stock: 5,
    price100Paise: 50000, compareAt100Paise: 65000, stock100: 3, status: "active" }, owner);
  assert.equal(saved.status, 200);
  const id = saved.data.id;
  const cookie = (await call("/cart")).cookie;
  for (const variantId of ["50ml", "100ml"]) {
    const result = await call("/cart", "POST", { productId: id, variantId, quantity: 2 }, cookie);
    assert.equal(result.status, 200);
  }
  let cart = (await call("/cart", "GET", null, cookie)).data;
  assert.equal(cart.items.length, 2);
  assert.equal(cart.count, 4);
  assert.equal(cart.subtotalPaise, 160000);
  assert.deepEqual(cart.items.map(p => p.variantId).sort(), ["100ml", "50ml"]);
  assert.equal((await call("/cart", "POST", { productId: id, variantId: "200ml", quantity: 1 }, cookie)).status, 400);
  assert.equal((await call("/cart", "POST", { productId: id, variantId: "100ml", quantity: 2 }, cookie)).status, 409);
  const body = { productId: id, variantId: "100ml", quantity: 2, paymentMethod: "cod", address, idempotencyKey: "size-checkout-unique", pricePaise: 1 };
  const order = await call("/orders", "POST", body, `${owner}; ${cookie}`);
  assert.equal(order.status, 200);
  assert.equal(order.data.unitPricePaise, 50000);
  assert.equal(order.data.variantId, "100ml");
  assert.match(order.data.productName, /100 ml/);
  assert.equal((await get("products", id)).stock100, 1);
  assert.equal((await get("products", id)).stock, 5);
  cart = (await call("/cart", "GET", null, cookie)).data;
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].variantId, "50ml");
  assert.equal((await call("/orders", "POST", { ...body, idempotencyKey: "size-insufficient-stock" }, owner)).status, 409);
  assert.equal((await call(`/admin/orders/${order.data.id}`, "PATCH", { status: "cancelled" }, owner)).status, 200);
  assert.equal((await get("products", id)).stock100, 3);
  assert.equal((await get("products", id)).stock, 5);
  assert.equal((await call(`/admin/products/${id}`, "PATCH", { compareAt100Paise: 100 }, owner)).status, 400);
});

test("Rich blog and policy content is sanitized and publish dates control public access", async () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const created = await call("/admin/posts", "POST", {
    title: "Rich story", slug: "rich-story", excerpt: "A story excerpt", contentFormat: "html",
    content: '<h2>Heading</h2><p><strong>Bold</strong> and <em>italic</em></p><ul><li>One</li></ul><script>alert(1)</script><img src="/product-showcase.webp" onerror="alert(1)"><a href="javascript:alert(1)">Bad link</a>',
    status: "published", publishedAt: future, featured: true, tags: ["Hair care"], categoryIds: [], relatedPostIds: [], author: "Store team",
  }, editor);
  assert.equal(created.status, 200);
  assert.match(created.data.content, /<strong>Bold<\/strong>/);
  assert.doesNotMatch(created.data.content, /<script|onerror|javascript:/);
  assert.equal(created.data.featured, true);
  assert.equal((await call("/public")).data.posts.some(p => p.id === created.data.id), false);
  assert.equal((await fetch(origin + "/blog/rich-story")).status, 404);
  assert.doesNotMatch(await (await fetch(origin + "/sitemap.xml")).text(), /rich-story/);
  assert.equal((await call(`/admin/posts/${created.data.id}`, "PATCH", { publishedAt: new Date(Date.now() - 1000).toISOString() }, editor)).status, 200);
  assert.equal((await call("/public")).data.posts.some(p => p.id === created.data.id), true);
  const page = await (await fetch(origin + "/blog/rich-story")).text();
  assert.match(page, /<h2>Heading<\/h2>/);
  assert.match(page, /<strong>Bold<\/strong>/);
  assert.doesNotMatch(page, /onerror|javascript:/);
  const policy = await call("/admin/policies/privacy", "PATCH", { contentFormat: "html", content: "<h2>Your privacy</h2><p>We respect <strong>your information</strong>.</p>", status: "published" }, editor);
  assert.equal(policy.status, 200);
  assert.match(await (await fetch(origin + "/policies/privacy")).text(), /<strong>your information<\/strong>/);
  assert.equal((await call("/admin/policies/privacy", "PATCH", { content: "<p><br></p><script>alert(1)</script>" }, editor)).status, 400);
  assert.equal((await call(`/admin/posts/${created.data.id}`, "PATCH", { publishedAt: "not-a-date" }, editor)).status, 400);
});

test("Staff can upload featured/body images and the image endpoint preserves their bytes", async () => {
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=", "base64");
  const upload = cookie => fetch(origin + "/api/media", { method: "POST", headers: { "Content-Type": "image/png", Cookie: cookie }, body: bytes });
  assert.equal((await upload("")).status, 403);
  const result = await upload(editor);
  assert.equal(result.status, 200);
  const { url } = await result.json();
  assert.match(url, /^\/api\/media\/[a-f0-9-]+$/);
  const image = await fetch(origin + url);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
  assert.equal((await fetch(origin + "/api/media", { method: "POST", headers: { "Content-Type": "image/png", Cookie: editor }, body: "not-an-image" })).status, 400);
});

test("Lead and review deletion respects staff permissions and preserves protected records", async () => {
  await insert("leads", { id: "delete-lead", name: "Spam enquiry" });
  await insert("reviews", { id: "delete-review", name: "Spam review" });
  assert.equal((await call("/admin/leads/delete-lead", "DELETE", null, customer)).status, 403);
  assert.equal((await call("/admin/leads/delete-lead", "DELETE", null, editor)).status, 403);
  assert.ok(await get("leads", "delete-lead"));
  assert.equal((await call("/admin/leads/delete-lead", "DELETE", null, owner)).status, 200);
  assert.equal((await call("/admin/reviews/delete-review", "DELETE", null, editor)).status, 200);
  assert.ok(!(await get("leads", "delete-lead")));
  assert.ok(!(await get("reviews", "delete-review")));
  assert.equal((await call("/admin/policies/privacy", "DELETE", null, owner)).status, 400);
  assert.ok(await get("policies", "privacy"));
  assert.equal((await call("/admin/webhooks/example", "DELETE", null, owner)).status, 405);
});

after(async () => {
  await new Promise(r => server.close(r));
  await client.close();
  await mongo.stop();
});
