import { randomBytes, createHash } from "node:crypto";
import {
  all,
  findOne,
  findMany,
  get,
  put,
  tx,
  update,
  insert,
  now,
} from "./db.js";
import { check, address as validateAddress } from "./validate.js";
import { mail } from "./integrations.js";
import {
  createRazorpayOrder,
  verifyCheckoutPayment,
} from "./razorpay.js";
import { cartIdentifier, consumeCartById } from "./cart.js";
import { productForSize } from "../../src/shared/productOptions.js";

const paymentRecordId = (id) => "PAY-" + id;

async function releaseReservation(order, status) {
  await tx(async () => {
    const current = await get("orders", order.id);
    if (current?.status !== "awaiting_payment") return;
    const product = await get("products", current.productId);
    if (product) {
      const stockKey = current.variantId === "100ml" ? "stock100" : "stock";
      await put("products", {
        ...product,
        [stockKey]: (product[stockKey] || 0) + current.quantity,
      });
    }
    const at = now();
    await put("orders", {
      ...current,
      status,
      paymentStatus: "failed",
      timeline: [...(current.timeline || []), { status, at }],
      updatedAt: at,
    });
    const payment = await get("payments", paymentRecordId(current.id));
    if (payment)
      await put("payments", {
        ...payment,
        status: status === "payment_expired" ? "expired" : "failed",
        updatedAt: at,
      });
  });
}

export async function expireRazorpayReservations() {
  const at = Date.now();
  for (const order of await all("orders")) {
    if (
      order.paymentMethod === "razorpay" &&
      order.status === "awaiting_payment" &&
      Date.parse(order.paymentExpiresAt) <= at
    )
      await releaseReservation(order, "payment_expired");
  }
}

export async function createOnlinePayment(user, body, req) {
  await expireRazorpayReservations();
  const idempotencyKey = String(body.idempotencyKey || "").trim();
  check(idempotencyKey.length >= 16 && idempotencyKey.length <= 100, "Checkout request key required");
  const existing = await findOne("orders", {
    userId: user.id,
    idempotencyKey,
  });
  if (existing) {
    check(
      existing.paymentMethod === "razorpay" &&
        existing.status === "awaiting_payment" &&
        existing.razorpayOrderId,
      "Start a new payment attempt",
      409,
    );
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: existing.razorpayOrderId,
      localOrderId: existing.id,
      amount: existing.totalPaise,
      currency: "INR",
    };
  }

  check(
    Number.isSafeInteger(body.quantity) &&
      body.quantity > 0 &&
      body.quantity <= 20,
    "Quantity must be 1–20",
  );
  const deliveryAddress = validateAddress(body.address);
  const id = "DY-" + randomBytes(6).toString("hex").toUpperCase();
  const order = await tx(async () => {
    check(
      !(await findOne("orders", { userId: user.id, idempotencyKey })),
      "Checkout request already exists",
      409,
    );
    const base = await get("products", String(body.productId || ""));
    const variantId = body.variantId || "50ml";
    const product = productForSize(base, variantId);
    check(product?.status === "active" && product.pricePaise > 0, "Product unavailable");
    check(product.stock >= body.quantity, "Insufficient stock", 409);
    const shippingPaise = (await get("settings", "store")).shippingPaise || 0;
    const totalPaise = product.pricePaise * body.quantity + shippingPaise;
    check(Number.isSafeInteger(totalPaise) && totalPaise >= 100, "Invalid payment amount");
    const stockKey = variantId === "100ml" ? "stock100" : "stock";
    await put("products", {
      ...base,
      [stockKey]: product.stock - body.quantity,
    });
    const at = now();
    const created = await put("orders", {
      id,
      userId: user.id,
      email: user.email,
      customer: user.name,
      address: deliveryAddress,
      productId: product.id,
      productName: `${product.name} · ${product.sizeLabel}`,
      variantId: product.variantId,
      sizeLabel: product.sizeLabel,
      sku: product.sku,
      quantity: body.quantity,
      unitPricePaise: product.pricePaise,
      subtotalPaise: product.pricePaise * body.quantity,
      shippingPaise,
      totalPaise,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      status: "awaiting_payment",
      idempotencyKey,
      cartId: cartIdentifier(req),
      paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: at,
      timeline: [{ status: "awaiting_payment", at }],
    });
    await put("payments", {
      id: paymentRecordId(id),
      orderId: id,
      customer: user.name,
      amountPaise: totalPaise,
      method: "razorpay",
      status: "pending",
      createdAt: at,
    });
    return created;
  });

  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder(
      order.totalPaise,
      order.id,
      { orderId: order.id },
    );
    check(
      razorpayOrder.id &&
        razorpayOrder.amount === order.totalPaise &&
        razorpayOrder.currency === "INR",
      "Razorpay returned mismatched order details",
      502,
    );
    await tx(async () => {
      const current = await get("orders", order.id);
      check(current?.status === "awaiting_payment", "Payment attempt expired", 409);
      await put("orders", { ...current, razorpayOrderId: razorpayOrder.id });
      const payment = await get("payments", paymentRecordId(order.id));
      await put("payments", {
        ...payment,
        providerOrderId: razorpayOrder.id,
      });
    });
  } catch (error) {
    await releaseReservation(order, "payment_failed");
    throw error;
  }
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: razorpayOrder.id,
    localOrderId: order.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
}

async function acceptCapturedPayment(payment) {
  check(payment?.order_id && payment.id, "Razorpay payment details are incomplete");
  const localPayment = await findOne("payments", {
    providerOrderId: payment.order_id,
  });
  check(localPayment, "No matching storefront payment", 404);
  check(
    payment.amount === localPayment.amountPaise && payment.currency === "INR",
    "Razorpay payment amount does not match the order",
  );
  let updatedOrder;
  await tx(async () => {
    const current = await get("orders", localPayment.orderId);
    check(current, "Order not found", 404);
    const storedPayment = await get("payments", localPayment.id);
    if (storedPayment.status === "paid") {
      updatedOrder = current;
      return;
    }
    const at = now();
    const late =
      current.status !== "awaiting_payment" ||
      Date.parse(current.paymentExpiresAt) <= Date.now();
    const orderStatus = late ? "payment_review" : "placed";
    updatedOrder = await put("orders", {
      ...current,
      status: orderStatus,
      paymentStatus: "paid",
      razorpayPaymentId: payment.id,
      timeline: [
        ...(current.timeline || []),
        { status: orderStatus, at },
      ],
    });
    await put("payments", {
      ...storedPayment,
      status: "paid",
      providerPaymentId: payment.id,
      reference: payment.id,
      updatedAt: at,
    });
    await consumeCartById(
      current.cartId,
      current.productId,
      current.quantity,
      current.variantId,
    );
    await put("audit", {
      userId: "system",
      action: `Razorpay payment captured for ${current.id}${late ? " (review required)" : ""}`,
      createdAt: at,
    });
  });
  if (updatedOrder.status === "placed") {
    try {
      await mail(
        updatedOrder.email,
        `Order ${updatedOrder.id} received`,
        `Your payment for ${updatedOrder.quantity} × ${updatedOrder.productName} was received. Total INR ${(updatedOrder.totalPaise / 100).toFixed(2)}.`,
      );
    } catch {
      console.error("Razorpay order email failed; payment saved");
    }
  }
  return updatedOrder;
}

async function acceptFailedPayment(payment) {
  if (!payment?.order_id) return;
  const localPayment = await findOne("payments", {
    providerOrderId: payment.order_id,
  });
  if (!localPayment || localPayment.status !== "pending") return;
  const order = await get("orders", localPayment.orderId);
  if (order) await releaseReservation(order, "payment_failed");
}

export async function verifyOnlinePayment(user, body) {
  const localOrder = await findOne("orders", {
    razorpayOrderId: String(body.razorpay_order_id || ""),
  });
  check(localOrder?.userId === user.id, "Payment order not found", 404);
  const payment = await findOne("payments", {
    providerOrderId: localOrder.razorpayOrderId,
  });
  if (
    payment?.status === "paid" &&
    payment.providerPaymentId === body.razorpay_payment_id
  )
    return { order: localOrder, paymentStatus: "paid" };
  check(payment?.status === "pending", "Payment has already been processed", 409);
  const verified = await verifyCheckoutPayment(
    localOrder.razorpayOrderId,
    String(body.razorpay_payment_id || ""),
    String(body.razorpay_signature || ""),
  );
  check(verified, "Razorpay payment signature is invalid", 400);
  check(
    verified.amount === localOrder.totalPaise && verified.currency === "INR",
    "Razorpay payment amount does not match the order",
  );
  if (verified.status === "captured") {
    const order = await acceptCapturedPayment(verified);
    return { order, paymentStatus: order.paymentStatus };
  }
  return { order: localOrder, paymentStatus: "pending" };
}

export async function processRazorpayWebhook(event) {
  const payment = event?.payload?.payment?.entity;
  if (event.event === "payment.captured" && payment?.status === "captured")
    await acceptCapturedPayment(payment);
  else if (event.event === "payment.failed")
    await acceptFailedPayment(payment);
}

export async function processShiprocketWebhook(event) {
  const payload = event?.tracking_data || event?.data || event;
  const externalId = String(
    payload.order_id || payload.channel_order_id || payload.orderId || "",
  );
  const awb = String(payload.awb || payload.awb_code || payload.awbCode || "");
  return tx(async () => {
    let order = externalId ? await get("orders", externalId) : null;
    if (!order && awb)
      order = (await findMany("orders")).find(
        (candidate) => candidate.shipment?.awb === awb,
      );
    if (!order?.shipment) return null;
    const trackingStatus =
      payload.current_status || payload.status || payload.current_status_id;
    const shipment = {
      ...order.shipment,
      trackingStatus: String(trackingStatus || "updated").slice(0, 200),
      trackingUpdatedAt: now(),
      trackingEvent: payload,
    };
    await put("orders", { ...order, shipment });
    return order.id;
  });
}

export async function receiveWebhook(provider, providerEventId, event) {
  const eventType = String(event.event || event.event_name || event.current_status || "unknown").slice(0, 120);
  let record = await findOne("webhooks", { provider, providerEventId });
  if (record?.status === "processed") return { ok: true, duplicate: true };
  if (!record) {
    record = {
      id: randomBytes(16).toString("hex"),
      provider,
      providerEventId,
      eventType,
      status: "received",
      payload: event,
      createdAt: now(),
    };
    try {
      await insert("webhooks", record);
    } catch (error) {
      if (error.code !== 11000) throw error;
      record = await findOne("webhooks", { provider, providerEventId });
      if (record?.status === "processed") return { ok: true, duplicate: true };
    }
  }
  check(record, "Unable to record webhook event", 500);
  try {
    if (provider === "razorpay") await processRazorpayWebhook(event);
    else await processShiprocketWebhook(event);
    await update(
      "webhooks",
      { id: record.id },
      { status: "processed", processedAt: now(), error: "" },
    );
    return { ok: true };
  } catch (error) {
    await update(
      "webhooks",
      { id: record.id },
      { status: "failed", error: String(error.message).slice(0, 500) },
    );
    throw error;
  }
}

export function shiprocketEventId(rawBody) {
  return createHash("sha256").update(rawBody).digest("hex");
}
