import { Router } from "express";
import { cartController } from "../controllers/cartController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const cartRoutes = Router();
cartRoutes.use(async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await cartController(req, res, next);
  } catch (error) {
    next(error);
  }
});
