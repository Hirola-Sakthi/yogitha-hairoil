import { defineModel } from "./model.js";
export const Payment = defineModel("Payment", "payments", {
  id: String,
  orderId: String,
  customer: String,
  amountPaise: Number,
  method: String,
  status: String,
  providerOrderId: String,
  providerPaymentId: String,
  reference: String,
  createdAt: String,
  updatedAt: String,
});
