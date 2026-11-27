import { defineModel } from "./model.js";
export const Cart = defineModel("Cart", "carts", {
  // Carts are intentionally keyed by a SHA-256 digest of the browser token.
  // The token itself is never stored in MongoDB.
  _id: String,
  items: { type: Array, default: [] },
  expires: Date,
});
