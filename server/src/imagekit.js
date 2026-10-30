import { createHash } from "node:crypto";
import { extname } from "node:path";

const uploadEndpoint = "https://upload.imagekit.io/api/v1/files/upload";

export function imageKitConfigured() {
  return Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT,
  );
}

export function imageKitUrl(path) {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT?.replace(/\/+$/, "");
  if (!endpoint || typeof path !== "string" || !path.startsWith("/") || path.startsWith("/api/")) return path;
  return `${endpoint}${path}`;
}

export async function uploadImageKitFile({ bytes, file, fileName, folder }) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey || !process.env.IMAGEKIT_URL_ENDPOINT) {
    throw Object.assign(
      new Error("Configure IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT."),
      { status: 503 },
    );
  }
  const form = new FormData();
  if (typeof file === "string") {
    form.set("file", file);
  } else {
    form.set("file", new Blob([bytes]), fileName);
  }
  form.set("fileName", fileName);
  form.set("folder", folder);
  form.set("useUniqueFileName", "false");
  form.set("overwriteFile", "true");

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
    },
    body: form,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("ImageKit returned an unreadable upload response.");
  }
  if (!response.ok) {
    throw new Error(result.message || `ImageKit upload failed (${response.status}).`);
  }
  if (typeof result.url !== "string" || typeof result.filePath !== "string") {
    throw new Error("ImageKit returned an incomplete upload response.");
  }
  return result;
}

export async function hostImageKitUrl(sourceUrl) {
  if (typeof sourceUrl !== "string" || !sourceUrl) return sourceUrl;
  if (sourceUrl.startsWith("//")) sourceUrl = `https:${sourceUrl}`;
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT?.replace(/\/+$/, "");
  if (endpoint && sourceUrl.startsWith(`${endpoint}/`)) return sourceUrl;
  if (sourceUrl.startsWith("/") && !sourceUrl.startsWith("/api/")) {
    return imageKitUrl(sourceUrl);
  }
  if (!/^https?:\/\//i.test(sourceUrl)) return sourceUrl;
  const parsed = new URL(sourceUrl);
  if (parsed.hostname === "imagekit.io" || parsed.hostname.endsWith(".imagekit.io")) return sourceUrl;
  const extension = [".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"].includes(extname(parsed.pathname).toLowerCase())
    ? extname(parsed.pathname).toLowerCase()
    : ".webp";
  const hash = createHash("sha256").update(sourceUrl).digest("hex");
  const uploaded = await uploadImageKitFile({
    file: sourceUrl,
    fileName: `external-${hash}${extension}`,
    folder: "/migrated-external",
  });
  return uploaded.url;
}

export async function hostImageKitHtml(html) {
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  let result = html;
  for (const tag of tags) {
    const source = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (!source) continue;
    const hosted = await hostImageKitUrl(source[2].replace(/&amp;/g, "&"));
    if (hosted !== source[2]) {
      const escapedUrl = hosted.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      result = result.replace(tag, tag.replace(source[0], `src="${escapedUrl}"`));
    }
  }
  return result;
}
