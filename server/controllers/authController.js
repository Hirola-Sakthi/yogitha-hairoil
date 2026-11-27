import { randomBytes, randomUUID } from "node:crypto";
import { deleteMany, findOne, insert, now, tx, update } from "../models/db.js";
import {
  digest,
  hash,
  limit,
  login,
  logout,
  safe,
  user,
  verify,
} from "../middleware/auth.js";
import { mail } from "../services/integrations.js";
import { check, email, text } from "../utils/validate.js";

export async function authController(req, res, next) {
  try {
    const path = new URL(req.originalUrl, "http://localhost").pathname;
    const body = req.body || {};
    const currentUser = await user(req);
    if (path === "/api/auth/me") return res.json({ user: currentUser });
    if (path === "/api/auth/logout" && req.method === "POST") {
      await logout(req, res);
      return res.json({ ok: true });
    }
    check(req.method === "POST", "Method not allowed", 405);
    check(
      [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot",
        "/api/auth/reset",
      ].includes(path),
      "Not found",
      404,
    );
    check(
      await limit("auth:" + req.socket.remoteAddress),
      "Too many attempts. Try again later.",
      429,
    );
    if (path === "/api/auth/reset") {
      check(
        typeof body.password === "string" &&
          body.password.length >= 10 &&
          body.password.length <= 128,
        "Use 10–128 password characters",
      );
      await tx(async () => {
        const token = await findOne("resets", {
          token: digest(text(body.token)),
          expires: { $gt: new Date() },
        });
        check(token, "Invalid or expired reset link");
        await update(
          "users",
          { id: token.userId },
          { password: hash(body.password) },
        );
        await deleteMany("resets", { userId: token.userId });
        await deleteMany("sessions", { userId: token.userId });
      });
      return res.json({ message: "Password updated. Sign in to continue." });
    }
    const accountEmail = text(body.email).toLowerCase();
    check(email(accountEmail), "Enter a valid email");
    const existing = await findOne("users", { email: accountEmail });
    if (path === "/api/auth/forgot") {
      if (existing?.active) {
        const token = randomBytes(32).toString("hex");
        await deleteMany("resets", { userId: existing.id });
        await insert("resets", {
          token: digest(token),
          userId: existing.id,
          expires: new Date(Date.now() + 1800000),
        });
        try {
          await mail(
            accountEmail,
            "Reset your password",
            `${process.env.SITE_URL}/reset-password?token=${token}\nExpires in 30 minutes.`,
          );
        } catch {
          console.error("Reset email failed");
        }
      }
      return res.json({
        message:
          "If this account exists and email is configured, a reset link will be sent.",
      });
    }
    check(
      typeof body.password === "string" &&
        body.password.length >= 10 &&
        body.password.length <= 128,
      "Use 10–128 password characters",
    );
    if (path === "/api/auth/login") {
      check(
        verify(body.password, existing?.password) && existing?.active,
        "Incorrect email or password",
        401,
      );
      await login(res, existing);
      return res.json({ user: safe(existing) });
    }
    check(!existing, "This email cannot be registered", 409);
    check(text(body.name), "Name is required");
    const account = {
      id: randomUUID(),
      name: text(body.name, 100),
      email: accountEmail,
      role: "customer",
      active: 1,
      createdAt: now(),
    };
    await insert("users", { ...account, password: hash(body.password) });
    await login(res, account);
    return res.json({ user: safe(account) });
  } catch (error) {
    next(error);
  }
}
