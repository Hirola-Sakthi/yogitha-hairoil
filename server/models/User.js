import { defineModel } from "./model.js";
export const User = defineModel("User", "users", {
  id: String,
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: String,
  role: String,
  active: Number,
  createdAt: String,
  updatedAt: String,
});
