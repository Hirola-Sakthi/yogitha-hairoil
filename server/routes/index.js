import { Router } from "express";
import { healthController } from "../controllers/healthController.js";
import { media } from "../controllers/media.js";
import { adminRoutes } from "./adminRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { cartRoutes } from "./cartRoutes.js";
import { categoryRoutes } from "./categoryRoutes.js";
import { contentRoutes } from "./contentRoutes.js";
import { dashboardRoutes } from "./dashboardRoutes.js";
import { orderRoutes } from "./orderRoutes.js";
import { paymentRoutes } from "./paymentRoutes.js";
import { productRoutes } from "./productRoutes.js";
import { userRoutes } from "./userRoutes.js";
import { webhookRoutes } from "./webhookRoutes.js";
import { storefrontRoutes } from "./storefrontRoutes.js";
import { leadRoutes } from "./leadRoutes.js";
import { reviewRoutes } from "./reviewRoutes.js";
import { shippingRoutes } from "./shippingRoutes.js";
import { settingsRoutes } from "./settingsRoutes.js";

export const apiRouter = Router();

const requestUrl = (req) => new URL(req.originalUrl, "http://localhost");
const asyncRoute = (handler) => (req, res, next) => {
  void handler(req, res, next).catch(next);
};

apiRouter.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  });
  next();
});

apiRouter.get("/health", healthController);

apiRouter.all(
  ["/media", "/media/{*path}"],
  asyncRoute(async (req, res) => {
    await media(req, res, requestUrl(req));
  }),
);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/cart", cartRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/account/refunds", orderRoutes);
apiRouter.use("/refunds", orderRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/webhooks", webhookRoutes);
apiRouter.use("/public", storefrontRoutes);
apiRouter.use("/leads", leadRoutes);
apiRouter.use("/reviews", reviewRoutes);
apiRouter.use("/shipping", shippingRoutes);
apiRouter.use("/admin/dashboard", dashboardRoutes);
apiRouter.use("/admin/products", productRoutes);
apiRouter.use("/admin/categories", categoryRoutes);
apiRouter.use("/admin/posts", contentRoutes);
apiRouter.use("/admin/policies", contentRoutes);
apiRouter.use("/admin/users", userRoutes);
apiRouter.use("/admin/customers", userRoutes);
apiRouter.use("/admin/settings", settingsRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use((req, res) => res.status(404).json({ error: "Not found" }));
