import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
export const dashboardRoutes = Router();
dashboardRoutes.use(dashboardController);
