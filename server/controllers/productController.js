import { all, audit, get, now, put, remove, tx } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { check, validate } from "../utils/validate.js";

export async function productController(req, res, next) {
  try {
    const account = await user(req);
    check(
      account && ["owner", "manager", "editor"].includes(account.role),
      "Admin access required",
      403,
    );
    check(account.role !== "editor", "Content editor permission required", 403);
    const parts = new URL(req.originalUrl, "http://localhost").pathname.split(
      "/",
    );
    const id = parts[4];
    if (req.method === "GET") {
      const result = id ? await get("products", id) : await all("products");
      check(result, "Not found", 404);
      return res.json(result);
    }
    if (req.method === "POST" || req.method === "PATCH") {
      const old = id ? await get("products", id) : {};
      check(old, "Not found", 404);
      const data = validate("products", req.body || {}, old);
      if (data.slug)
        check(
          !(await all("products")).some(
            (product) => product.slug === data.slug && product.id !== id,
          ),
          "Slug already exists",
          409,
        );
      const saved = await tx(async () => {
        const record = await put("products", {
          ...data,
          id: id || undefined,
          createdAt: old.createdAt || now(),
        });
        await audit(account, `Saved products: ${record.id}`);
        return record;
      });
      return res.json(saved);
    }
    check(req.method === "DELETE", "Method not allowed", 405);
    check(
      !(await all("orders")).some(
        (order) =>
          order.productId === id ||
          order.items?.some((item) => item.productId === id),
      ),
      "Products with orders must be archived",
    );
    await remove("products", id);
    await audit(account, `Deleted products: ${id}`);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
