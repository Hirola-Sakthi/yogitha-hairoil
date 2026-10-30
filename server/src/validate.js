import { cleanContent, contentText } from "./content.js";
export function check(c, m, status = 400) {
  if (!c) throw Object.assign(new Error(m), { status });
}
export const text = (v, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
export const email = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
const schemas = {
  products: {
    name: "text",
    slug: "slug",
    sku: "text",
    description: "long",
    pricePaise: "int",
    compareAtPricePaise: "int",
    price100Paise: "int",
    compareAt100Paise: "int",
    stock100: "int",
    image100: "url",
    stock: "int",
    status: ["draft", "active", "archived"],
    image: "url",
    weight: "number",
    length: "number",
    breadth: "number",
    height: "number",
    seoTitle: "text",
    seoDescription: "text",
    faq: "faq",
  },
  leads: {
    name: "text",
    email: "email",
    phone: "text",
    subject: "text",
    message: "long",
    status: ["new", "contacted", "resolved"],
  },
  posts: {
    contentFormat: ["text", "html"],
    publishedAt: "date",
    featured: "boolean",
    tags: "strings",
    categoryIds: "strings",
    relatedPostIds: "strings",
    title: "text",
    slug: "slug",
    excerpt: "long",
    content: "long",
    author: "text",
    categoryId: "text",
    image: "url",
    status: ["draft", "published"],
    seoTitle: "text",
    seoDescription: "text",
  },
  categories: { name: "text", slug: "slug", description: "long" },
  policies: {
    contentFormat: ["text", "html"],
    publishedAt: "date",
    title: "text",
    slug: "slug",
    content: "long",
    status: ["draft", "published"],
    seoTitle: "text",
    seoDescription: "text",
  },
  reviews: { status: ["pending", "approved", "rejected"] },
  settings: {
    instagramUrl: "url",
    facebookUrl: "url",
    youtubeUrl: "url",
    linkedinUrl: "url",
    whatsapp: "text",
    brand: "text",
    description: "long",
    email: "optionalEmail",
    phone: "text",
    address: "long",
    shippingPaise: "int",
    seoTitle: "text",
    seoDescription: "text",
    socialImage: "url",
  },
};
export function validate(c, b, old = {}) {
  check(schemas[c], "Unknown module");
  const d = { ...old };
  for (const [k, t] of Object.entries(schemas[c])) {
    if (!(k in b)) continue;
    const v = b[k];
    if (Array.isArray(t)) {
      check(t.includes(v), `Invalid ${k}`);
      d[k] = v;
    } else if (t === "boolean") {
      check(typeof v === "boolean", `Invalid ${k}`);
      d[k] = v;
    } else if (t === "date") {
      check(v === "" || (typeof v === "string" && Number.isFinite(Date.parse(v))), `Invalid ${k}`);
      d[k] = v ? new Date(v).toISOString() : "";
    } else if (t === "strings") {
      check(Array.isArray(v) && v.length <= 20 && v.every(x => typeof x === "string" && x.length <= 100), `Invalid ${k}`);
      d[k] = [...new Set(v.map(x => text(x, 100)).filter(Boolean))];
    } else if (t === "int" || t === "number") {
      check(
        Number.isFinite(Number(v)) &&
          Number(v) >= 0 &&
          (t !== "int" || Number.isSafeInteger(Number(v))),
        `Invalid ${k}`,
      );
      d[k] = Number(v);
    } else if (t === "faq") {
      check(Array.isArray(v) && v.length <= 20, "Invalid FAQ");
      d[k] = v.map((f) => ({
        question: text(f.question),
        answer: text(f.answer, 2000),
      }));
    } else {
      d[k] = text(v, t === "long" ? 30000 : 500);
      if (t === "slug")
        check(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d[k]),
          "Use a lowercase URL slug",
        );
      if (t === "email" || (t === "optionalEmail" && d[k]))
        check(email(d[k]), "Invalid email");
      if (t === "url")
        check(
          !d[k] ||
            /^https:\/\//.test(d[k]) ||
            (d[k].startsWith("/") && !d[k].startsWith("//")),
          "Use an HTTPS or local image URL",
        );
    }
  }
  for (const k of c === "products"
    ? ["name", "slug", "sku"]
    : c === "categories"
      ? ["name", "slug"]
      : ["posts", "policies"].includes(c)
        ? ["title", "slug"]
        : c === "leads"
          ? ["name", "email", "message"]
          : [])
    check(d[k], `${k} is required`);
  if (c === "leads" && d.phone)
    check(/^[6-9]\d{9}$/.test(d.phone), "Enter a 10-digit Indian mobile number");
  if (c === "products" && d.status === "active")
    check(d.pricePaise > 0, "Set a confirmed price before activation");
  if (c === "products" && d.compareAtPricePaise)
    check(d.compareAtPricePaise >= d.pricePaise, "Original price must be at least the selling price (or 0 for no discount)");
  if (c === "products") {
    if (d.compareAt100Paise) check(d.compareAt100Paise >= (d.price100Paise || 0), "100 ml original price must be at least its selling price");
    if (d.stock100 > 0) check(d.price100Paise > 0, "Set the 100 ml price before adding its stock");
  }
  if (["posts", "policies"].includes(c)) {
    if (d.contentFormat === "html") d.content = cleanContent(d.content);
    if (d.status === "published") {
      check(d.contentFormat === "html" ? contentText(d.content) : d.content, "Published content cannot be empty");
      if (!d.publishedAt) d.publishedAt = new Date().toISOString();
    }
    if (c === "posts" && d.categoryIds) d.categoryId = d.categoryIds[0] || "";
  }
  if (c === "settings" && d.whatsapp) {
    check(/^\+?[1-9][\d\s()-]{6,20}$/.test(d.whatsapp) && /^[1-9]\d{6,14}$/.test(d.whatsapp.replace(/\D/g, "")), "Enter a WhatsApp number including country code");
  }
  return d;
}
export function address(v) {
  check(v && typeof v === "object", "Address required");
  const a = Object.fromEntries(
    ["name", "phone", "line1", "line2", "city", "state", "pincode"].map((k) => [
      k,
      text(v[k], 200),
    ]),
  );
  for (const k of ["name", "line1", "city", "state"])
    check(a[k], `${k} required`);
  check(/^[6-9]\d{9}$/.test(a.phone), "Enter a 10-digit Indian mobile number");
  check(/^\d{6}$/.test(a.pincode), "Enter a 6-digit PIN code");
  return a;
}
