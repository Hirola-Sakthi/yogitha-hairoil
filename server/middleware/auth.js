import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { db, findOne, insert, deleteMany } from "../models/db.js";
export const digest = (s) => createHash("sha256").update(s).digest("hex");
export function hash(p) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(p, salt, 64).toString("hex");
}
const dummy = hash("not-an-account-password");
export function verify(p, h = dummy) {
  const [salt, key] = h.split(":");
  return timingSafeEqual(Buffer.from(key, "hex"), scryptSync(p, salt, 64));
}
const raw = (req) =>
  (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("session="))
    ?.slice(8);
export const safe = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: !!u.active,
  createdAt: u.createdAt,
});
export async function user(req) {
  const t = raw(req);
  if (!t) return null;
  const session = await findOne("sessions", {
    token: digest(t),
    expires: { $gt: new Date() },
  });
  if (!session) return null;
  const u = await findOne("users", { id: session.userId, active: 1 });
  return u ? safe(u) : null;
}
export async function login(res, u) {
  const token = randomBytes(32).toString("hex");
  await insert("sessions", {
    token: digest(token),
    userId: u.id,
    expires: new Date(Date.now() + 86400000),
  });
  res.setHeader(
    "Set-Cookie",
    `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}
export async function logout(req, res) {
  if (raw(req)) await deleteMany("sessions", { token: digest(raw(req)) });
  res.setHeader(
    "Set-Cookie",
    "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );
}
export async function limit(key, n = 15) {
  const time = new Date();
  const expired = { $lte: [{ $ifNull: ["$expires", new Date(0)] }, time] };
  const r = await db.collection("limits").findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          n: { $cond: [expired, 1, { $add: ["$n", 1] }] },
          expires: {
            $cond: [expired, new Date(time.getTime() + 900000), "$expires"],
          },
        },
      },
    ],
    { upsert: true, returnDocument: "after" },
  );
  return r.n <= n;
}
