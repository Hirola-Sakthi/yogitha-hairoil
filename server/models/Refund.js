import { defineModel } from "./model.js";
export const Refund = defineModel("Refund", "refunds", {
  id: String,
  userId: String,
  orderId: String,
  customer: String,
  amountPaise: Number,
  reason: String,
  status: String,
  reference: String,
  createdAt: String,
  updatedAt: String,
});
