import { randomBytes } from "node:crypto";
import { all, get, now, put, tx } from "../models/db.js";
import { user } from "../middleware/auth.js";
import {
  mail,
  quoteShiprocketShipping,
  status,
} from "../services/integrations.js";
import { consumeCart } from "../services/cart.js";
import {
  adjustCheckoutStock,
  legacyOrderFields,
  resolveCheckoutItems,
} from "../services/checkoutItems.js";
import { expireRazorpayReservations } from "../services/paymentFlows.js";
import { address, check, text } from "../utils/validate.js";

export async function orderController(req, res, next) {
  try {
    const path = new URL(req.originalUrl, "http://localhost").pathname;
    const account = await user(req);
    check(account, "Please sign in to continue", 401);
    const body = req.body || {};
    if (path === "/api/orders" && req.method === "GET")
      return res.json(
        (await all("orders")).filter((order) => order.userId === account.id),
      );
    if (path === "/api/account/refunds" && req.method === "GET")
      return res.json(
        (await all("refunds")).filter((refund) => refund.userId === account.id),
      );
    if (path === "/api/refunds" && req.method === "POST") {
      const order = await get("orders", text(body.orderId));
      check(order?.userId === account.id, "Order not found", 404);
      check(order.paymentStatus === "paid", "A recorded payment is required");
      check(text(body.reason), "Reason required");
      check(
        !(await all("refunds")).some(
          (refund) =>
            refund.orderId === order.id && refund.status !== "rejected",
        ),
        "A refund request already exists",
        409,
      );
      return res.json(
        await put("refunds", {
          userId: account.id,
          orderId: order.id,
          customer: account.name,
          amountPaise: order.totalPaise,
          reason: text(body.reason, 2000),
          status: "requested",
          createdAt: now(),
        }),
      );
    }
    check(path === "/api/orders" && req.method === "POST", "Not found", 404);
    await expireRazorpayReservations();
    check(status().cod, "Checkout is not enabled yet", 503);
    check(body.paymentMethod === "cod", "Only cash on delivery is available");
    const deliveryAddress = address(body.address),
      key = text(body.idempotencyKey, 100);
    check(key.length >= 16, "Checkout request key required");
    const items = await resolveCheckoutItems(body);
    const fallbackPaise = (await get("settings", "store")).shippingPaise || 0;
    const shippingQuote = await quoteShiprocketShipping({
      deliveryPostcode: deliveryAddress.pincode,
      items,
      paymentMethod: "cod",
      declaredValue: items.reduce((sum, item) => sum + item.subtotalPaise, 0),
      fallbackPaise,
    });
    let created = false;
    const order = await tx(async () => {
      const duplicate = (await all("orders")).find(
        (item) => item.userId === account.id && item.idempotencyKey === key,
      );
      if (duplicate) return duplicate;
      await adjustCheckoutStock(items, -1);
      const saved = await put("orders", {
        id: "DY-" + randomBytes(6).toString("hex").toUpperCase(),
        userId: account.id,
        email: account.email,
        customer: account.name,
        address: deliveryAddress,
        ...legacyOrderFields(items),
        shippingPaise: shippingQuote.shippingPaise,
        shippingQuote,
        totalPaise:
          items.reduce((sum, item) => sum + item.subtotalPaise, 0) +
          shippingQuote.shippingPaise,
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "placed",
        idempotencyKey: key,
        createdAt: now(),
        timeline: [{ status: "placed", at: now() }],
      });
      await put("payments", {
        id: "PAY-" + saved.id,
        orderId: saved.id,
        customer: account.name,
        amountPaise: saved.totalPaise,
        status: "pending",
        method: "cod",
        createdAt: now(),
      });
      await consumeCart(req, items);
      created = true;
      return saved;
    });
    if (created)
      try {
        await mail(
          account.email,
          `Order ${order.id} received`,
          `Your order is placed. Total INR ${(order.totalPaise / 100).toFixed(2)}, payable on delivery.`,
        );
      } catch {
        console.error("Order email failed; order saved");
      }
    res.json(order);
  } catch (error) {
    next(error);
  }
}
