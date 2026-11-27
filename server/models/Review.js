import { defineModel } from "./model.js";
export const Review = defineModel("Review", "reviews", {
  id: String,
  userId: String,
  productId: String,
  name: String,
  email: String,
  location: String,
  rating: Number,
  content: String,
  status: String,
  source: String,
  createdAt: String,
  updatedAt: String,
});
