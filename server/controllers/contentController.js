import { all, audit, get, now, put, remove, tx } from "../models/db.js";
import { user } from "../middleware/auth.js";
import {
  hostImageKitHtml,
  hostImageKitUrl,
  imageKitConfigured,
} from "../services/imagekit.js";
import { check, validate } from "../utils/validate.js";

export async function contentController(req, res, next) {
  try {
    const account = await user(req);
    check(
      account && ["owner", "manager", "editor"].includes(account.role),
      "Admin access required",
      403,
    );
    const path = new URL(req.originalUrl, "http://localhost").pathname.split(
      "/",
    );
    const collection = path[3];
    const id = path[4];
    check(["posts", "policies"].includes(collection), "Not found", 404);
    if (req.method === "GET") {
      const result = id ? await get(collection, id) : await all(collection);
      check(result, "Not found", 404);
      return res.json(result);
    }
    if (req.method === "DELETE") {
      check(collection === "posts", "Archive instead");
      check(id, "Not found", 404);
      await remove(collection, id);
      await audit(account, `Deleted ${collection}: ${id}`);
      return res.json({ ok: true });
    }
    check(["POST", "PATCH"].includes(req.method), "Method not allowed", 405);
    const old = id ? await get(collection, id) : {};
    check(old, "Not found", 404);
    const data = validate(collection, req.body || {}, old);
    if (imageKitConfigured()) {
      for (const field of ["image", "socialImage"])
        if (typeof data[field] === "string")
          data[field] = await hostImageKitUrl(data[field]);
      if (data.contentFormat === "html" && typeof data.content === "string")
        data.content = await hostImageKitHtml(data.content);
    }
    if (data.slug)
      check(
        !(await all(collection)).some(
          (record) => record.slug === data.slug && record.id !== id,
        ),
        "Slug already exists",
        409,
      );
    const saved = await tx(async () => {
      const record = await put(collection, {
        ...data,
        id: id || undefined,
        createdAt: old.createdAt || now(),
      });
      await audit(account, `Saved ${collection}: ${record.id}`);
      return record;
    });
    res.json(saved);
  } catch (error) {
    next(error);
  }
}
