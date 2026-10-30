import { preview } from "../shared/api";
export async function uploadImage(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  if (preview) throw new Error("File uploads require the backend. Use an image URL in this preview.");
  const response = await fetch("/api/media", { method: "POST", credentials: "include", headers: { "Content-Type": file.type }, body: file });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Image upload failed.");
  return result.url;
}
