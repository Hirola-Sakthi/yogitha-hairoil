import { user } from "../middleware/auth.js";
import {
  createOnlinePayment,
  verifyOnlinePayment,
} from "../services/paymentFlows.js";
import { check } from "../utils/validate.js";

export async function paymentController(req, res, next) {
  try {
    const account = await user(req);
    check(account, "Please sign in to continue", 401);
    const path = new URL(req.originalUrl, "http://localhost").pathname;
    if (req.method === "POST" && path === "/api/payments/razorpay/order")
      return res.json(await createOnlinePayment(account, req.body || {}, req));
    if (req.method === "POST" && path === "/api/payments/razorpay/verify")
      return res.json(await verifyOnlinePayment(account, req.body || {}));
    check(false, "Not found", 404);
  } catch (error) {
    next(error);
  }
}
