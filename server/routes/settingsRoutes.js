import { Router } from "express";
import { settingsController } from "../controllers/settingsController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const settingsRoutes = Router();
settingsRoutes.use(async (req, res, next) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) req.body = await jsonBody(req);
    await settingsController(req, res, next);
  } catch (error) {
    next(error);
  }
});
