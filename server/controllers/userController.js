import { randomUUID } from "node:crypto";
import {
  audit,
  deleteMany,
  findMany,
  findOne,
  insert,
  now,
  update,
} from "../models/db.js";
import { hash, safe, user } from "../middleware/auth.js";
import { check, email, text } from "../utils/validate.js";

export async function userController(req, res, next) {
  try {
    const account = await user(req);
    check(
      account && ["owner", "manager"].includes(account.role),
      "Admin access required",
      403,
    );
    const parts = new URL(req.originalUrl, "http://localhost").pathname.split(
      "/",
    );
    const type = parts[3],
      id = parts[4];
    const ownersOnly = type === "users";
    if (ownersOnly)
      check(account.role === "owner", "Owner access required", 403);
    if (req.method === "GET")
      return res.json(
        (
          await findMany(
            "users",
            type === "customers"
              ? { role: "customer" }
              : { role: { $ne: "customer" } },
          )
        ).map(safe),
      );
    check(account.role === "owner", "Owner access required", 403);
    if (req.method === "POST") {
      const body = req.body || {};
      check(
        email(body.email) && text(body.name),
        "Name and valid email required",
      );
      check(["manager", "editor"].includes(body.role), "Invalid role");
      check(
        typeof body.password === "string" &&
          body.password.length >= 10 &&
          body.password.length <= 128,
        "Use 10–128 password characters",
      );
      check(
        !(await findOne("users", { email: body.email.toLowerCase() })),
        "Email already exists",
        409,
      );
      const userId = randomUUID();
      await insert("users", {
        id: userId,
        name: text(body.name),
        email: body.email.toLowerCase(),
        password: hash(body.password),
        role: body.role,
        active: 1,
        createdAt: now(),
      });
      await audit(account, "Created staff account");
      return res.json(safe(await findOne("users", { id: userId })));
    }
    check(req.method === "PATCH", "Method not allowed", 405);
    const target = await findOne("users", { id });
    check(target && target.role !== "owner", "Owner cannot be modified here");
    check(["manager", "editor"].includes(req.body.role), "Invalid role");
    await update(
      "users",
      { id },
      { role: req.body.role, active: req.body.active ? 1 : 0 },
    );
    await deleteMany("sessions", { userId: id });
    await audit(account, "Updated staff access");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
