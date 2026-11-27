import { defineModel } from "./model.js";
export const Audit = defineModel("Audit", "audit", {
  id: String,
  userId: String,
  action: String,
  createdAt: String,
  updatedAt: String,
});
