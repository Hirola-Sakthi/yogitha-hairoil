import { check } from "../utils/validate.js";

// The storefront uses the same-origin API (Vite proxies it during development).
export function checkOrigin(req) {
  check(
    !req.headers.origin ||
      req.headers.origin ===
        new URL(process.env.SITE_URL || "http://localhost:5173").origin,
    "Origin not allowed",
    403,
  );
}
