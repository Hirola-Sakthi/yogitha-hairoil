import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hostImageKitHtml,
  hostImageKitUrl,
  imageKitConfigured,
  imageKitUrl,
} from "../services/imagekit.js";

test("ImageKit maps local public image paths without changing API URLs", () => {
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/dr-yogithas";
  assert.equal(
    imageKitUrl("/product-showcase.webp"),
    "https://ik.imagekit.io/dr-yogithas/product-showcase.webp",
  );
  assert.equal(imageKitUrl("/api/media/legacy-id"), "/api/media/legacy-id");
});

test("ImageKit hosting preserves already-hosted images and rewrites HTML sources", async () => {
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/dr-yogithas";
  const image = "https://ik.imagekit.io/dr-yogithas/blog/body.webp";
  assert.equal(await hostImageKitUrl(image), image);
  assert.equal(
    await hostImageKitHtml(
      `<p>Text</p><img src="/product-showcase.webp" alt="Product">`,
    ),
    `<p>Text</p><img src="https://ik.imagekit.io/dr-yogithas/product-showcase.webp" alt="Product">`,
  );
});

test("ImageKit readiness requires both private credentials and endpoint configuration", () => {
  process.env.IMAGEKIT_PRIVATE_KEY = "";
  assert.equal(imageKitConfigured(), false);
  process.env.IMAGEKIT_PRIVATE_KEY = "test-private-key";
  assert.equal(imageKitConfigured(), true);
});
