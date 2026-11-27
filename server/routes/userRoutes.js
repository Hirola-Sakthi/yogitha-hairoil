import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const userRoutes = Router();
userRoutes.use(async (req, res, next) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) req.body = await jsonBody(req);
    await userController(req, res, next);
  } catch (error) {
    next(error);
  }
});
