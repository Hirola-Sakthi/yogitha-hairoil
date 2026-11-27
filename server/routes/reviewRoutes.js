import { Router } from "express";
import { createReview } from "../controllers/reviewController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const reviewRoutes = Router();
reviewRoutes.post("/", async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await createReview(req, res, next);
  } catch (error) {
    next(error);
  }
});
