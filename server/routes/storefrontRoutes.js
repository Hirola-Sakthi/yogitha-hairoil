import { Router } from "express";
import { storefrontController } from "../controllers/storefrontController.js";
export const storefrontRoutes = Router();
storefrontRoutes.get("/", storefrontController);
