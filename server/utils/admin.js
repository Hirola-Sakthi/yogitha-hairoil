import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { now, findOne, insert, client } from "../models/db.js";
import { hash } from "../middleware/auth.js";
import { check, email } from "./validate.js";
let rl;
try {
  const e = process.argv[2]?.toLowerCase();
  check(email(e), "Usage: npm run admin -- owner@example.com");
  check(
    !(await findOne("users", {
      role: "owner",
    })),
    "Owner already exists; use password reset",
  );
  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log("Use a private terminal. Password input is visible.");
  const p = await rl.question("Owner password (10+ characters): ");
  rl.close();
  check(p.length >= 10 && p.length <= 128, "Use 10–128 characters");
  await insert("users", {
    id: randomUUID(),
    name: "Store owner",
    email: e,
    password: hash(p),
    role: "owner",
    active: 1,
    createdAt: now(),
  });
  console.log("Owner created. Sign in at /admin.");
} catch (error) {
  console.error(
    error.code === 11000 ? "Owner or email already exists." : error.message,
  );
  process.exitCode = 1;
} finally {
  rl?.close();
  await client.close();
}
