import { createHmac } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  razorpaySignature,
  razorpayStatus,
  secureEqual,
  verifyRazorpayWebhook,
} from "../src/razorpay.js";

test("Razorpay checkout signatures are generated from the provider order and payment IDs", () => {
  process.env.RAZORPAY_KEY_SECRET = "test-key-secret";
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update("order_test|pay_test")
    .digest("hex");
  assert.equal(razorpaySignature("order_test", "pay_test"), expected);
});

test("Razorpay webhook signatures verify the exact raw request body", () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret";
  const body = Buffer.from('{"event":"payment.captured"}');
  const signature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  assert.equal(verifyRazorpayWebhook(body, signature), true);
  assert.equal(verifyRazorpayWebhook(Buffer.from(body.toString() + "\n"), signature), false);
  assert.equal(verifyRazorpayWebhook(body, `${signature}00`), false);
});

test("Razorpay readiness requires API credentials without exposing the secret", () => {
  process.env.RAZORPAY_MODE = "test";
  process.env.RAZORPAY_KEY_ID = "rzp_test_public";
  process.env.RAZORPAY_KEY_SECRET = "test-key-secret";
  const readiness = razorpayStatus();
  assert.equal(readiness.enabled, true);
  assert.equal(readiness.keyId, "rzp_test_public");
  assert.equal("keySecret" in readiness, false);
  process.env.RAZORPAY_KEY_ID = "rzp_live_public";
  assert.equal(razorpayStatus().enabled, false);
});

test("Shiprocket webhook token comparison is constant-time and exact", () => {
  assert.equal(secureEqual("shiprocket-token", "shiprocket-token"), true);
  assert.equal(secureEqual("shiprocket-token", "wrong-token"), false);
});
