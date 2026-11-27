import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const categoryRoutes = Router();
categoryRoutes.use(async (req, res, next) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) req.body = await jsonBody(req);
    await categoryController(req, res, next);
  } catch (error) {
    next(error);
  }
});
