import { Router } from "express";
import { productController } from "../controllers/productController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const productRoutes = Router();
productRoutes.use(async (req, res, next) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) req.body = await jsonBody(req);
    await productController(req, res, next);
  } catch (error) {
    next(error);
  }
});
