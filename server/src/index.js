import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { api } from "./api.js";
import { discovery, render } from "./seo.js";
import { check } from "./validate.js";
import { media } from "./media.js";
const dist = resolve(fileURLToPath(new URL("../../dist/", import.meta.url)));
export const server = http.createServer(async (req, res) => {
  try {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/media" || url.pathname.startsWith("/api/media/")) {
      await media(req, res, url);
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Robots-Tag", "noindex");
      if (!["GET", "HEAD"].includes(req.method)) {
        check(!req.headers.origin || req.headers.origin === new URL(process.env.SITE_URL || "http://localhost:5173").origin, "Origin not allowed", 403);
        check(req.headers["content-type"]?.startsWith("application/json"), "JSON required", 415);
      }
      const chunks = [];
      let rawLength = 0;
      for await (const c of req) {
        chunks.push(c);
        rawLength += c.length;
        check(rawLength <= 128000, "Request too large", 413);
      }
      const rawBody = Buffer.concat(chunks);
      req.rawBody = rawBody;
      let b = {};
      if (rawBody.length) {
        try {
          b = JSON.parse(rawBody.toString("utf8"));
        } catch {
          check(false, "Invalid JSON");
        }
      }
      check(b && typeof b === "object" && !Array.isArray(b), "JSON object required");
      res.end(JSON.stringify(await api(req, res, url, b)));
      return;
    }
    const d = await discovery(url.pathname);
    if (d !== null) {
      res.setHeader("Content-Type", url.pathname.endsWith(".xml") ? "application/xml" : "text/plain; charset=utf-8");
      res.end(d);
      return;
    }
    let p;
    try {
      p = resolve(dist, "." + decodeURIComponent(url.pathname));
    } catch {
      check(false, "Invalid path");
    }
    check(p === dist || p.startsWith(dist + sep), "Forbidden", 403);
    if (extname(p) && extname(p) !== ".html") {
      try {
        const bytes = await readFile(p);
        res.setHeader("Content-Type", {
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".woff2": "font/woff2",
          ".json": "application/json"
        }[extname(p)] || "application/octet-stream");
        res.end(bytes);
        return;
      } catch {
        check(false, "Not found", 404);
      }
    }
    const result = await render(await readFile(resolve(dist, "index.html"), "utf8"), url.pathname);
    res.writeHead(result.status, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    });
    res.end(result.html);
  } catch (e) {
    if (e.code === 11000) {
      e.status = 409;
      e.message = "A record with these details already exists.";
    }
    res.statusCode = e.status || 500;
    res.setHeader("Content-Type", "application/json");
    if (!e.status) console.error(e.message);
    res.end(JSON.stringify({
      error: e.status ? e.message : "Request failed. Please try again."
    }));
  }
});
if (process.env.NODE_ENV !== "test") server.listen(Number(process.env.PORT || 4000), "0.0.0.0", () => console.log("Storefront and shared API listening on " + (process.env.PORT || 4000)));
