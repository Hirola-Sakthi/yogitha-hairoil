import { Router } from "express";
import { createLead } from "../controllers/leadController.js";
import { jsonBody } from "../middleware/jsonBody.js";
export const leadRoutes = Router();
leadRoutes.post("/", async (req, res, next) => {
  try {
    req.body = await jsonBody(req);
    await createLead(req, res, next);
  } catch (error) {
    next(error);
  }
});
