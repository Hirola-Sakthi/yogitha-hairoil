import { defineModel } from "./model.js";

// Rate-limit keys are application-defined strings, not ObjectIds.
export const RateLimit = defineModel("RateLimit", "limits", {
  _id: String,
  n: Number,
  expires: Date,
});
