import { defineModel } from "./model.js";

// This model supports reading legacy MongoDB-backed uploads while new uploads
// are stored in ImageKit.
export const Media = defineModel("Media", "media", {
  _id: String,
  type: String,
  bytes: Buffer,
  imagekitUrl: String,
  createdAt: String,
  updatedAt: String,
});
