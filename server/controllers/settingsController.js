import { audit, get, put } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { hostImageKitUrl, imageKitConfigured } from "../services/imagekit.js";
import { check, validate } from "../utils/validate.js";

export async function settingsController(req, res, next) {
  try {
    const account = await user(req);
    check(account?.role === "owner", "Owner access required", 403);
    if (req.method === "GET") return res.json(await get("settings", "store"));
    check(req.method === "PATCH", "Method not allowed", 405);
    const settings = validate(
      "settings",
      req.body || {},
      await get("settings", "store"),
    );
    if (imageKitConfigured())
      settings.socialImage = await hostImageKitUrl(settings.socialImage);
    const saved = await put("settings", settings);
    await audit(account, "Updated settings");
    res.json(saved);
  } catch (error) {
    next(error);
  }
}
