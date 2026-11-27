import { Router } from "express";
import { orderController } from "../controllers/orderController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const orderRoutes = Router();
orderRoutes.use(async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await orderController(req, res, next);
  } catch (error) {
    next(error);
  }
});
