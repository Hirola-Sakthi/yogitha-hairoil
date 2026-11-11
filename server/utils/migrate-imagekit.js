import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { client, db } from "../config/mongo.js";
import {
  hostImageKitUrl,
  imageKitConfigured,
  uploadImageKitFile,
} from "../services/imagekit.js";

const apply = process.argv.includes("--apply");
const publicRoot = resolve(
  fileURLToPath(new URL("../../public/", import.meta.url)),
);
const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);
const imageFields = /image|avatar|logo|thumbnail|cover|poster/i;
const pathMap = new Map();
const remoteMap = new Map();
let migratedReferences = 0;

async function filesUnder(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(folder, entry.name);
      return entry.isDirectory() ? filesUnder(path) : [path];
    }),
  );
  return nested.flat();
}

function mediaBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value?.value === "function") return Buffer.from(value.value(true));
  if (value?.buffer) return Buffer.from(value.buffer);
  throw new Error("A legacy media record has no readable image bytes.");
}

function extensionForType(type) {
  return { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[
    type
  ];
}

function endpointAlreadyHosts(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "imagekit.io" || hostname.endsWith(".imagekit.io");
  } catch {
    return false;
  }
}

async function uploadRemoteImage(sourceUrl) {
  const normalizedUrl = sourceUrl.startsWith("//")
    ? `https:${sourceUrl}`
    : sourceUrl;
  if (endpointAlreadyHosts(normalizedUrl)) return normalizedUrl;
  if (remoteMap.has(normalizedUrl)) return remoteMap.get(normalizedUrl);
  const parsed = new URL(normalizedUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) return sourceUrl;
  const uploaded = await hostImageKitUrl(normalizedUrl);
  remoteMap.set(normalizedUrl, uploaded);
  migratedReferences += 1;
  return uploaded;
}

async function imageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return value;
  if (pathMap.has(value)) {
    migratedReferences += 1;
    return pathMap.get(value);
  }
  if (/^(https?:)?\/\//i.test(value)) return uploadRemoteImage(value);
  const suffixIndex = value.search(/[?#]/);
  const path = suffixIndex < 0 ? value : value.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? "" : value.slice(suffixIndex);
  const normalizedPath = `/${path.replace(/^\/+/, "").replace(/\\/g, "/")}`;
  if (pathMap.has(normalizedPath)) {
    migratedReferences += 1;
    return `${pathMap.get(normalizedPath)}${suffix}`;
  }
  return value;
}

function localImagePath(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    /^(https?:|data:|blob:|\/\/)/i.test(value)
  ) {
    return null;
  }
  const suffixIndex = value.search(/[?#]/);
  const path = suffixIndex < 0 ? value : value.slice(0, suffixIndex);
  return `/${path.replace(/^\/+/, "").replace(/\\/g, "/")}`;
}

function collectImagePaths(value, key, paths) {
  if (typeof value === "string") {
    if (key === "content") {
      for (const tag of value.match(/<img\b[^>]*>/gi) || []) {
        const source = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
        const path = source && localImagePath(source[2].replace(/&amp;/g, "&"));
        if (path) paths.add(path);
      }
    } else if (imageFields.test(key)) {
      const path = localImagePath(value);
      if (path) paths.add(path);
    }
    return;
  }
  if (
    !value ||
    typeof value !== "object" ||
    value instanceof Date ||
    Buffer.isBuffer(value) ||
    value._bsontype
  ) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImagePaths(item, key, paths);
    return;
  }
  for (const [childKey, child] of Object.entries(value)) {
    if (childKey !== "_id" && childKey !== "bytes")
      collectImagePaths(child, childKey, paths);
  }
}

async function rewriteHtml(html) {
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  let result = html;
  for (const tag of tags) {
    const source = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (!source) continue;
    const url = await imageUrl(source[2].replace(/&amp;/g, "&"));
    if (url !== source[2]) {
      const escapedUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      result = result.replace(
        tag,
        tag.replace(source[0], `src="${escapedUrl}"`),
      );
    }
  }
  return result;
}

async function rewriteValue(value, key = "") {
  if (typeof value === "string") {
    if (key === "content") return rewriteHtml(value);
    return imageFields.test(key) ? imageUrl(value) : value;
  }
  if (
    !value ||
    typeof value !== "object" ||
    value instanceof Date ||
    Buffer.isBuffer(value) ||
    value._bsontype
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => rewriteValue(item, key)));
  }
  const result = {};
  for (const [childKey, child] of Object.entries(value)) {
    result[childKey] =
      childKey === "_id" || childKey === "bytes"
        ? child
        : await rewriteValue(child, childKey);
  }
  return result;
}

async function run() {
  const publicFiles = (await filesUnder(publicRoot)).filter((file) =>
    imageExtensions.has(extname(file).toLowerCase()),
  );
  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();
  const documents = [];
  for (const { name } of collections) {
    if (name === "media" || name.startsWith("system.")) continue;
    for (const document of await db.collection(name).find({}).toArray()) {
      documents.push({ collection: name, document });
    }
  }
  const referencedPaths = new Set();
  for (const { collection, document } of documents) {
    if (collection !== "products")
      collectImagePaths(document, "", referencedPaths);
  }
  const referencedFiles = publicFiles.filter((file) => {
    const path = `/${relative(publicRoot, file).split(sep).join("/")}`;
    return referencedPaths.has(path);
  });
  console.log(
    `Backend-referenced local public images: ${referencedFiles.length}`,
  );
  if (!apply) {
    console.log(
      "Dry run only. Back up MongoDB, configure ImageKit credentials, then pass --apply to migrate backend-referenced images.",
    );
    return;
  }
  if (!imageKitConfigured()) {
    throw new Error(
      "Configure IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT before migration.",
    );
  }

  for (const file of referencedFiles) {
    const rel = relative(publicRoot, file);
    const folderPath = dirname(rel).split(sep).join("/");
    const folder = folderPath === "." ? "/" : `/${folderPath}`;
    const uploaded = await uploadImageKitFile({
      bytes: await readFile(file),
      fileName: basename(file),
      folder,
    });
    pathMap.set(`/${rel.split(sep).join("/")}`, uploaded.url);
  }
  console.log(
    `Uploaded ${referencedFiles.length} backend-referenced public images.`,
  );

  const mediaCollection = db.collection("media");
  const mediaRecords = await mediaCollection.find({}).toArray();
  for (const record of mediaRecords) {
    if (record.imagekitUrl) {
      pathMap.set(`/api/media/${record._id}`, record.imagekitUrl);
      continue;
    }
    const extension = extensionForType(record.type);
    if (!extension)
      throw new Error(`Unsupported legacy image type: ${record.type}`);
    const uploaded = await uploadImageKitFile({
      bytes: mediaBytes(record.bytes),
      fileName: `${record._id}${extension}`,
      folder: "/uploads",
    });
    pathMap.set(`/api/media/${record._id}`, uploaded.url);
    await mediaCollection.updateOne(
      { _id: record._id },
      { $set: { imagekitUrl: uploaded.url }, $unset: { bytes: "" } },
    );
  }
  console.log(`Migrated ${mediaRecords.length} legacy uploaded images.`);

  let updatedDocuments = 0;
  for (const { collection, document } of documents) {
    if (collection === "products") continue;
    const rewritten = await rewriteValue(document);
    if (JSON.stringify(document) !== JSON.stringify(rewritten)) {
      await db
        .collection(collection)
        .replaceOne({ _id: document._id }, rewritten);
      updatedDocuments += 1;
    }
  }
  console.log(
    `Updated ${updatedDocuments} MongoDB records; migrated ${migratedReferences} image references.`,
  );
}

try {
  await run();
} finally {
  await client.close();
}
