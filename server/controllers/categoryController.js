import { all, audit, get, now, put, remove, tx } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { check, validate } from "../utils/validate.js";

export async function categoryController(req, res, next) {
  try {
    const account = await user(req);
    check(
      account && ["owner", "manager", "editor"].includes(account.role),
      "Admin access required",
      403,
    );
    const id = new URL(req.originalUrl, "http://localhost").pathname.split(
      "/",
    )[4];
    if (req.method === "GET") {
      const result = id ? await get("categories", id) : await all("categories");
      check(result, "Not found", 404);
      return res.json(result);
    }
    const old = id ? await get("categories", id) : {};
    check(old, "Not found", 404);
    if (req.method === "POST" || req.method === "PATCH") {
      const data = validate("categories", req.body || {}, old);
      check(
        !(await all("categories")).some(
          (category) => category.slug === data.slug && category.id !== id,
        ),
        "Slug already exists",
        409,
      );
      const saved = await tx(async () => {
        const record = await put("categories", {
          ...data,
          id: id || undefined,
          createdAt: old.createdAt || now(),
        });
        await audit(account, `Saved categories: ${record.id}`);
        return record;
      });
      return res.json(saved);
    }
    check(req.method === "DELETE", "Method not allowed", 405);
    check(
      !(await all("posts")).some((post) => post.categoryId === id),
      "Category is in use",
    );
    await remove("categories", id);
    await audit(account, `Deleted categories: ${id}`);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
