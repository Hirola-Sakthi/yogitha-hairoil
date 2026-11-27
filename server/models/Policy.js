import { defineModel } from "./model.js";
export const Policy = defineModel("Policy", "policies", {
  id: String,
  title: { type: String, trim: true },
  slug: String,
  content: String,
  contentFormat: String,
  status: String,
  publishedAt: String,
  seoTitle: String,
  seoDescription: String,
  createdAt: String,
  updatedAt: String,
});
