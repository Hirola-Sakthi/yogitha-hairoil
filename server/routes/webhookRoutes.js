import { Router } from "express";
import { webhookController } from "../controllers/webhookController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const webhookRoutes = Router();
webhookRoutes.use(async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await webhookController(req, res, next);
  } catch (error) {
    next(error);
  }
});
