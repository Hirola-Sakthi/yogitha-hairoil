import { defineModel } from "./model.js";
export const Reset = defineModel("Reset", "resets", {
  token: String,
  userId: String,
  expires: Date,
});
