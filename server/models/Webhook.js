import { defineModel } from "./model.js";
export const Webhook = defineModel("Webhook", "webhooks", {
  id: String,
  provider: String,
  providerEventId: String,
  eventType: String,
  status: String,
  payload: Object,
  createdAt: String,
  processedAt: String,
  error: String,
  updatedAt: String,
});
