import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const authRoutes = Router();
authRoutes.use(async (req, res, next) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) req.body = await jsonBody(req);
    await authController(req, res, next);
  } catch (error) {
    next(error);
  }
});
