import { now, put } from "../models/db.js";
import { limit } from "../middleware/auth.js";
import { check, text, validate } from "../utils/validate.js";

export async function createLead(req, res, next) {
  try {
    check(
      await limit("lead:" + req.socket.remoteAddress, 8),
      "Try again later",
      429,
    );
    check(!req.body.website, "Invalid request");
    check(text(req.body.phone), "Phone is required");
    check(text(req.body.subject), "Subject is required");
    res.json(
      await put("leads", {
        ...validate("leads", { ...req.body, status: "new" }),
        createdAt: now(),
      }),
    );
  } catch (error) {
    next(error);
  }
}
