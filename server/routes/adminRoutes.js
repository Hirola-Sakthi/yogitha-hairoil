import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { jsonBody } from "../middleware/jsonBody.js";

export const adminRoutes = Router();

adminRoutes.use(async (req, res, next) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) req.body = await jsonBody(req);
    await adminController(req, res, next);
  } catch (error) {
    next(error);
  }
});
