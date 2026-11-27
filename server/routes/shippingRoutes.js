import { Router } from "express";
import { quoteShipping } from "../controllers/shippingController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const shippingRoutes = Router();
shippingRoutes.post("/quote", async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await quoteShipping(req, res, next);
  } catch (error) {
    next(error);
  }
});
