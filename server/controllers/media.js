import { checkOrigin } from "../cors/index.js";
import { randomUUID } from "node:crypto";
import { db } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { check } from "../utils/validate.js";
import { uploadImageKitFile } from "../services/imagekit.js";

export async function media(req, res, url) {
  if (req.method === "GET") {
    const id = url.pathname.slice("/api/media/".length);
    check(/^[a-f0-9-]{36}$/.test(id), "Image not found", 404);
    const image = await db.collection("media").findOne({ _id: id });
    check(image, "Image not found", 404);
    if (image.imagekitUrl) {
      res.statusCode = 302;
      res.setHeader("Location", image.imagekitUrl);
      res.end();
      return;
    }
    res.setHeader("Content-Type", image.type);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(Buffer.from(image.bytes.buffer));
    return;
  }
  check(
    req.method === "POST" && url.pathname === "/api/media",
    "Method not allowed",
    405,
  );
  checkOrigin(req);
  const u = await user(req);
  check(
    u && ["owner", "manager", "editor"].includes(u.role),
    "Admin access required",
    403,
  );
  const type = req.headers["content-type"];
  check(
    ["image/jpeg", "image/png", "image/webp"].includes(type),
    "Choose a JPG, PNG or WebP image",
    415,
  );
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    check(size <= 5 * 1024 * 1024, "Images must be 5 MB or smaller", 413);
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const valid =
    type === "image/png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  check(valid, "The file does not match its image type");
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[type];
  const image = await uploadImageKitFile({
    bytes,
    fileName: `${randomUUID()}.${extension}`,
    folder: "/uploads",
  });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ url: image.url }));
}
