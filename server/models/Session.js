import { defineModel } from "./model.js";
export const Session = defineModel("Session", "sessions", {
  token: String,
  userId: String,
  expires: Date,
});
