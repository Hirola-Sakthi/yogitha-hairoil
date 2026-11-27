import { secureEqual, verifyRazorpayWebhook } from "../services/razorpay.js";
import { receiveWebhook, shiprocketEventId } from "../services/paymentFlows.js";
import { status } from "../services/integrations.js";
import { check } from "../utils/validate.js";

export async function webhookController(req, res, next) {
  try {
    const path = new URL(req.originalUrl, "http://localhost").pathname;
    check(req.method === "POST", "Method not allowed", 405);
    if (path === "/api/webhooks/razorpay") {
      check(
        status().razorpay.webhook,
        "Configure the Razorpay webhook secret first",
        503,
      );
      check(
        verifyRazorpayWebhook(
          req.rawBody || Buffer.alloc(0),
          req.headers["x-razorpay-signature"],
        ),
        "Invalid Razorpay webhook signature",
        401,
      );
      const eventId = req.headers["x-razorpay-event-id"];
      check(
        typeof eventId === "string" &&
          eventId.length > 0 &&
          eventId.length <= 200,
        "Razorpay event ID required",
      );
      return res.json(
        await receiveWebhook("razorpay", eventId, req.body || {}),
      );
    }
    if (path === "/api/webhooks/shiprocket") {
      const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN || "";
      check(expected, "Configure the Shiprocket webhook token first", 503);
      const authorization = req.headers.authorization || "";
      const token =
        req.headers["x-shiprocket-token"] ||
        (authorization.startsWith("Bearer ") ? authorization.slice(7) : "");
      check(
        secureEqual(expected, token),
        "Invalid Shiprocket webhook token",
        401,
      );
      return res.json(
        await receiveWebhook(
          "shiprocket",
          shiprocketEventId(req.rawBody || Buffer.alloc(0)),
          req.body || {},
        ),
      );
    }
    check(false, "Not found", 404);
  } catch (error) {
    next(error);
  }
}
