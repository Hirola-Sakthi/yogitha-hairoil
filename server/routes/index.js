import { api } from "../controllers/api.js";
import { media } from "../controllers/media.js";
import { jsonBody } from "../middleware/jsonBody.js";

export async function route(req, res, url) {
  if (url.pathname === "/api/media" || url.pathname.startsWith("/api/media/")) {
    await media(req, res, url);
    return true;
  }
  if (!url.pathname.startsWith("/api/")) return false;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  const body = await jsonBody(req);
  res.end(JSON.stringify(await api(req, res, url, body)));
  return true;
}
