import { cleanContent } from "../utils/content.js";
import { isPublished } from "../../src/shared/publication.js";
import { all, get } from "../models/db.js";
import { imageKitUrl } from "./imagekit.js";
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
export async function publicPaths() {
  return [
    "/",
    "/about",
    "/shop",
    "/blog",
    "/contact",
    ...(await all("products"))
      .filter((p) => p.status === "active")
      .map((p) => "/products/" + p.slug),
    ...(await all("posts")).filter(isPublished).map((p) => "/blog/" + p.slug),
    ...(await all("policies"))
      .filter(isPublished)
      .map((p) => "/policies/" + p.slug),
  ];
}
export async function discovery(path) {
  const origin = (process.env.SITE_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  if (path === "/robots.txt")
    return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nDisallow: /account\nDisallow: /checkout\nDisallow: /reset-password\nSitemap: ${origin}/sitemap.xml\n`;
  if (path === "/sitemap.xml")
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${(await publicPaths()).map((p) => `<url><loc>${esc(origin + p)}</loc></url>`).join("")}</urlset>`;
  if (path === "/llms.txt")
    return `# ${(await get("settings", "store")).brand}\n\n> ${(await get("settings", "store")).description}\n\n## Public pages\n${(await publicPaths()).map((p) => `- [${p === "/" ? "Home" : p}](${origin + p})`).join("\n")}\n\nPublished pages are the source of truth. Do not infer unconfirmed medical benefits, certifications or product information.\n`;
  return null;
}
export async function render(html, path) {
  const s = await get("settings", "store"),
    origin = (process.env.SITE_URL || "http://localhost:4000").replace(
      /\/$/,
      "",
    );
  const product = (await all("products")).find(
      (p) => p.status === "active" && path === "/products/" + p.slug,
    ),
    post = (await all("posts")).find(
      (p) => isPublished(p) && path === "/blog/" + p.slug,
    ),
    policy = (await all("policies")).find(
      (p) => isPublished(p) && path === "/policies/" + p.slug,
    ),
    item = product || post || policy;
  const privatePage =
      /^\/(admin|cart|account|checkout|login|register|forgot-password|reset-password)/.test(
        path,
      ),
    known = (await publicPaths()).includes(path);
  const title = item?.seoTitle || item?.title || item?.name || s.seoTitle,
    description =
      item?.seoDescription ||
      item?.excerpt ||
      item?.description ||
      s.seoDescription;
  let schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.brand,
    url: origin,
    ...(s.email
      ? {
          email: s.email,
        }
      : {}),
  };
  if (product)
    schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      sku: product.sku,
      image: new URL(
        imageKitUrl(product.image || "/product-showcase.webp"),
        origin,
      ).href,
      brand: {
        "@type": "Brand",
        name: s.brand,
      },
      offers: {
        "@type": "Offer",
        url: origin + path,
        priceCurrency: "INR",
        price: (product.pricePaise / 100).toFixed(2),
        availability:
          "https://schema.org/" + (product.stock ? "InStock" : "OutOfStock"),
      },
    };
  if (post)
    schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Person",
        name: post.author || s.brand,
      },
      mainEntityOfPage: origin + path,
    };
  const head = `<meta name="description" content="${esc(description)}"><meta name="robots" content="${privatePage || !known ? "noindex, nofollow" : "index, follow"}"><link rel="canonical" href="${esc(origin + path)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin + path)}"><meta property="og:image" content="${esc(new URL(imageKitUrl(item?.image || s.socialImage || "/product-showcase.webp"), origin).href)}"><meta name="twitter:card" content="summary_large_image">${known ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : ""}`;
  const body = privatePage
    ? ""
    : `<main><h1>${esc(known ? title : "Page not found")}</h1><p>${esc(description)}</p>${item?.content ? `<article style="white-space:pre-wrap">${item.contentFormat === "html" ? cleanContent(item.content) : esc(item.content)}</article>` : ""}${product ? `<p>₹${(product.pricePaise / 100).toFixed(2)}</p>${(product.faq || []).map((f) => `<h2>${esc(f.question)}</h2><p>${esc(f.answer)}</p>`).join("")}` : ""}<nav>${(await publicPaths()).map((p) => `<a href="${esc(p)}">${esc(p === "/" ? "Home" : p)}</a> `).join("")}</nav></main>`;
  return {
    status: known || privatePage ? 200 : 404,
    html: html
      .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, "")
      .replace("</head>", head + "</head>")
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`),
  };
}
