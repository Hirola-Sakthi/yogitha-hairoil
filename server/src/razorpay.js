import { createHmac, timingSafeEqual } from "node:crypto";
import { check } from "./validate.js";

export function razorpayStatus() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const mode = process.env.RAZORPAY_MODE || "test";
  const keyMatchesMode =
    (mode === "test" && keyId.startsWith("rzp_test_")) ||
    (mode === "live" && keyId.startsWith("rzp_live_"));
  return {
    enabled: Boolean(keyMatchesMode && process.env.RAZORPAY_KEY_SECRET),
    webhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    keyId,
    mode,
  };
}

export function secureEqualHex(expected, actual) {
  if (
    typeof actual !== "string" ||
    !/^[a-f\d]+$/i.test(actual) ||
    expected.length !== actual.length
  ) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}

export function secureEqual(expected, actual) {
  if (typeof actual !== "string") return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function razorpaySignature(orderId, paymentId) {
  check(
    process.env.RAZORPAY_KEY_SECRET,
    "Configure Razorpay API keys first",
    503,
  );
  return createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function verifyRazorpayWebhook(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return secureEqualHex(expected, signature);
}

async function request(path, options = {}) {
  const { enabled } = razorpayStatus();
  check(enabled, "Configure Razorpay API keys first", 503);
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: options.body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Object.assign(new Error("Razorpay returned an invalid response"), {
      status: 502,
    });
  }
  if (!response.ok)
    throw Object.assign(
      new Error(data.error?.description || "Razorpay request failed"),
      { status: 502 },
    );
  return data;
}

export function createRazorpayOrder(amount, receipt, notes) {
  return request("orders", {
    body: { amount, currency: "INR", receipt, notes },
  });
}

export async function verifyCheckoutPayment(orderId, paymentId, signature) {
  if (!secureEqualHex(razorpaySignature(orderId, paymentId), signature))
    return null;
  const payment = await request(`payments/${encodeURIComponent(paymentId)}`);
  return payment.order_id === orderId ? payment : null;
}
