import { defineModel } from "./model.js";
export const Lead = defineModel("Lead", "leads", {
  id: String,
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  status: String,
  createdAt: String,
  updatedAt: String,
});
