import { Router } from "express";
import { paymentController } from "../controllers/paymentController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const paymentRoutes = Router();
paymentRoutes.use(async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await paymentController(req, res, next);
  } catch (error) {
    next(error);
  }
});
