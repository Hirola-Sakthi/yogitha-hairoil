import { requestId } from "./api";
import { productForSize } from "./productOptions";
import { isPublished } from "./publication";
const at = "2026-10-29T08:00:00Z";
const product = {
  id: "hair-oil",
  name: "Ayurvedic Hair Oil",
  slug: "ayurvedic-hair-oil",
  sku: "AYU-001",
  description: "A golden botanical hair oil inspired by Ayurvedic traditions.",
  pricePaise: 69900,
  price100Paise: 119900,
  compareAt100Paise: 139800,
  stock100: 24,
  stock: 48,
  status: "active",
  image: "/product-showcase.webp",
  weight: 0.25,
  length: 10,
  breadth: 10,
  height: 15,
  faq: [],
};
const makeOrder = (id, customer, q, status) => ({
  id,
  customer,
  email: "sample@example.com",
  userId: "sample-customer",
  productId: "hair-oil",
  productName: product.name,
  sku: product.sku,
  quantity: q,
  unitPricePaise: 69900,
  subtotalPaise: q * 69900,
  shippingPaise: 0,
  totalPaise: q * 69900,
  paymentMethod: "cod",
  paymentStatus: status === "delivered" ? "paid" : "pending",
  status,
  createdAt: at,
  address: {
    name: customer,
    line1: "Sample address — preview only",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    phone: "9000000000",
  },
  timeline: [
    { status: "placed", at },
    { status, at },
  ],
});
const initial = {
  settings: {
    id: "store",
    brand: "Dr. Yogitha's",
    description: "Ayurvedic hair oil inspired by botanical traditions.",
    email: "",
    phone: "",
    address: "",
    shippingPaise: 0,
    seoTitle: "Dr. Yogitha's — Ayurvedic Hair Oil",
    seoDescription: "A mindful botanical hair ritual.",
    socialImage: "/product-showcase.webp",
  },
  products: [product],
  orders: [
    makeOrder("DY-1028", "Aarohi S.", 1, "placed"),
    makeOrder("DY-1027", "Meera R.", 2, "processing"),
    makeOrder("DY-1026", "Ishaan K.", 1, "shipped"),
    makeOrder("DY-1025", "Diya M.", 3, "delivered"),
    makeOrder("DY-1024", "Arjun P.", 1, "delivered"),
  ],
  payments: [],
  audit: [],
  webhooks: [],
  refunds: [],
  leads: [
    {
      id: "L-001",
      name: "Sample enquiry",
      email: "sample@example.com",
      message: "When will the collection be available?",
      status: "new",
      createdAt: at,
    },
  ],
  customers: [
    {
      id: "sample-customer",
      name: "Preview customer",
      email: "customer@example.com",
      role: "customer",
      active: true,
      createdAt: at,
    },
  ],
  users: [
    {
      id: "sample-owner",
      name: "Store owner",
      email: "owner@example.com",
      role: "owner",
      active: true,
      createdAt: at,
    },
  ],
  reviews: [
    {
      id: "R-001",
      name: "Sample reviewer",
      rating: 4,
      content: "Sample moderation preview. Not a real customer testimonial.",
      status: "pending",
      productId: "hair-oil",
    },
  ],
  categories: [
    {
      id: "cat-1",
      name: "Hair rituals",
      slug: "hair-rituals",
      description: "Notes on a considered routine.",
    },
  ],
  posts: [
    {
      id: "post-1",
      title: "A little intention. A daily ritual.",
      slug: "a-mindful-hair-ritual",
      excerpt: "Make space for a slower moment in your day.",
      content:
        "A hair-care ritual can be a moment to slow down.\n\nRead the directions supplied with your product.\n\nThis is sample editorial content for the CMS preview.",
      author: "Dr. Yogitha's",
      categoryId: "cat-1",
      status: "published",
      image: "/product-showcase.webp",
      createdAt: at,
    },
  ],
  policies: ["privacy", "terms", "shipping", "returns"].map((slug) => ({
    id: slug,
    slug,
    title: {
      privacy: "Privacy policy",
      terms: "Terms & conditions",
      shipping: "Shipping policy",
      returns: "Returns & refunds",
    }[slug],
    status: "draft",
    content:
      "Draft. Add and review your business-specific policy before publishing.",
  })),
};
initial.payments = initial.orders.map((o) => ({
  id: "PAY-" + o.id,
  orderId: o.id,
  customer: o.customer,
  amountPaise: o.totalPaise,
  status: o.paymentStatus,
  method: "cod",
}));
let state;
try {
  state = JSON.parse(localStorage.getItem("ambar-preview-v2"));
} catch {}
state ||= structuredClone(initial);
state.audit ||= [];
state.webhooks ||= [];
let user = JSON.parse(sessionStorage.getItem("ambar-demo-user") || "null");
const save = () =>
  localStorage.setItem("ambar-preview-v2", JSON.stringify(state));
export async function demo(path, { method = "GET", body: b = {} } = {}) {
  if (path === "/cart") {
    const variantId = b.variantId || "50ml";
    const matches = line => line.productId === b.productId && (line.variantId || "50ml") === variantId;
    state.cart ||= [];
    if (method !== "GET") {
      const p = productForSize(state.products.find(p => p.id === b.productId), variantId);
      const old = state.cart.find(matches);
      const qty = method === "DELETE" ? 0 : method === "POST" ? (old?.quantity || 0) + b.quantity : b.quantity;
      if (!Number.isSafeInteger(qty) || qty < 0 || qty > 20) throw new Error("Quantity must be between 0 and 20");
      if (qty && (!p || p.status !== "active" || p.stock < qty)) throw new Error("No more stock available for this product");
      state.cart = state.cart.filter(p => !matches(p));
      if (qty) state.cart.push({ productId: b.productId, variantId, quantity: qty });
      save();
    }
    const items = state.cart.map(line => {
      const p = productForSize(state.products.find(p => p.id === line.productId), line.variantId || "50ml");
      return { ...line, variantId: line.variantId || "50ml", name: p ? `${p.name} · ${p.sizeLabel}` : "Unavailable product", image: p?.image,
        pricePaise: p?.pricePaise || 0, stock: p?.stock || 0,
        available: p?.status === "active" && p.stock >= line.quantity,
        totalPaise: (p?.pricePaise || 0) * line.quantity };
    });
    return { items, count: items.reduce((n, p) => n + p.quantity, 0), subtotalPaise: items.reduce((n, p) => n + p.totalPaise, 0) };
  }
  if (path === "/auth/me") return { user };
  if (path === "/auth/logout") {
    user = null;
    sessionStorage.removeItem("ambar-demo-user");
    return { ok: true };
  }
  if (path === "/auth/login" || path === "/auth/register") {
    user = {
      id: "sample-customer",
      name: b.name || "Preview customer",
      email: b.email || "customer@example.com",
      role: "customer",
    };
    sessionStorage.setItem("ambar-demo-user", JSON.stringify(user));
    return { user };
  }
  if (path === "/auth/forgot" || path === "/auth/reset")
    return { message: "Preview only. No email was sent." };
  if (path === "/public")
    return {
      ...structuredClone(state),
      products: state.products.filter((p) => p.status === "active"),
      posts: state.posts.filter(isPublished),
      policies: state.policies.filter(isPublished),
      reviews: state.reviews.filter((r) => r.status === "approved"),
      checkout: { cod: true, onlinePayments: false, razorpayKeyId: "" },
    };
  if (path === "/admin/dashboard")
    return {
      orders: state.orders.length,
      customers: state.customers.length,
      leads: state.leads.filter((l) => l.status === "new").length,
      revenuePaise: state.payments
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + p.amountPaise, 0),
      recentOrders: state.orders.slice(0, 6),
      integrations: {
        smtp: false,
        shiprocket: false,
        cod: true,
        onlinePayments: false,
        razorpay: { enabled: false, webhook: false, keyId: "" },
        shiprocketWebhook: false,
      },
    };
  if (path === "/admin/settings") {
    if (method === "PATCH") {
      state.settings = { ...state.settings, ...b };
      save();
    }
    return structuredClone(state.settings);
  }
  if (path === "/orders") {
    if (method === "GET") return state.orders;
    if (!user) throw new Error("Sign in to continue");
    const base = state.products.find((p) => p.id === b.productId);
    const p = productForSize(base, b.variantId || "50ml");
    if (!p || !p.pricePaise || p.stock < b.quantity) throw new Error("Insufficient stock");
    const o = {
      ...makeOrder(
        "DY-" + requestId().slice(0, 8),
        user.name,
        b.quantity,
        "placed",
      ),
      address: b.address,
      productId: p.id,
      productName: `${p.name} · ${p.sizeLabel}`,
      variantId: p.variantId,
      sku: p.sku,
      unitPricePaise: p.pricePaise,
      subtotalPaise: p.pricePaise * b.quantity,
      totalPaise: p.pricePaise * b.quantity + state.settings.shippingPaise,
      shippingPaise: state.settings.shippingPaise,
    };
    state.orders.unshift(o);
    base[p.variantId === "100ml" ? "stock100" : "stock"] -= b.quantity;
    state.cart = (state.cart || []).map(line => line.productId === p.id && (line.variantId || "50ml") === p.variantId ? { ...line, quantity: Math.max(0, line.quantity - b.quantity) } : line).filter(line => line.quantity);
    state.payments.unshift({
      id: "PAY-" + o.id,
      orderId: o.id,
      customer: user.name,
      amountPaise: o.totalPaise,
      method: "cod",
      status: "pending",
    });
    save();
    return o;
  }
  if (path === "/account/refunds") return state.refunds;
  if (["/leads", "/reviews", "/refunds"].includes(path)) {
    const c = path.slice(1),
      r = {
        id: requestId(),
        ...b,
        name: b.name || user?.name,
        customer: user?.name,
        amountPaise:
          state.orders.find((o) => o.id === b.orderId)?.totalPaise || 0,
        status:
          c === "leads" ? "new" : c === "reviews" ? "pending" : "requested",
        createdAt: new Date().toISOString(),
      };
    state[c].unshift(r);
    save();
    return r;
  }
  const [, a, c, id] = path.split("/");
  if (a === "admin") {
    if (c === "shiprocket") {
      if (method === "GET") return [];
      throw new Error(
        "Shiprocket is not connected in this preview. Configure credentials on the Node server.",
      );
    }
    if (!state[c]) throw new Error("Unknown preview module");
    if (method === "GET")
      return structuredClone(id ? state[c].find((r) => r.id === id) : state[c]);
    if (method === "DELETE") {
      if (!["products", "leads", "reviews", "posts", "categories"].includes(c))
        throw new Error("Archive instead");
      if (c === "products" && state.orders.some((o) => o.productId === id))
        throw new Error("Products with orders must be archived");
      if (c === "categories" && state.posts.some((p) => p.categoryId === id))
        throw new Error("Category is in use");
      state[c] = state[c].filter((r) => r.id !== id);
      save();
      return { ok: true };
    }
    if (method === "POST") {
      const r = { id: requestId(), ...b, createdAt: new Date().toISOString() };
      state[c].unshift(r);
      save();
      return r;
    }
    if (method === "PATCH") {
      const n = state[c].findIndex((r) => r.id === id);
      state[c][n] = { ...state[c][n], ...b };
      save();
      return state[c][n];
    }
  }
  throw new Error("Unavailable in preview");
}
