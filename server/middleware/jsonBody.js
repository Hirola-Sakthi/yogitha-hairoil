import { checkOrigin } from "../cors/index.js";
import { check } from "../utils/validate.js";

export async function jsonBody(req) {
  if (!["GET", "HEAD"].includes(req.method)) {
    checkOrigin(req);
    check(
      req.headers["content-type"]?.startsWith("application/json"),
      "JSON required",
      415,
    );
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    check(length <= 128000, "Request too large", 413);
    chunks.push(chunk);
  }
  // Webhook signatures must be verified against the original request bytes.
  req.rawBody = Buffer.concat(chunks);
  let body = {};
  if (req.rawBody.length) {
    try {
      body = JSON.parse(req.rawBody.toString("utf8"));
    } catch {
      check(false, "Invalid JSON");
    }
  }
  check(
    body && typeof body === "object" && !Array.isArray(body),
    "JSON object required",
  );
  return body;
}
