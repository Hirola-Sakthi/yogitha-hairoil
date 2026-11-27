import { defineModel } from "./model.js";
export const Category = defineModel("Category", "categories", {
  id: String,
  name: { type: String, trim: true },
  slug: { type: String, trim: true },
  description: String,
  createdAt: String,
  updatedAt: String,
});
