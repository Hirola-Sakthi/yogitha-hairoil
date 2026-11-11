import { get, put } from "../models/db.js";
import { check, text } from "../utils/validate.js";
import { productForSize } from "../../src/shared/productOptions.js";

export async function resolveCheckoutItems(body) {
  const requested = Array.isArray(body.items)
    ? body.items
    : [
        {
          productId: body.productId,
          variantId: body.variantId,
          quantity: body.quantity,
        },
      ];
  check(
    requested.length > 0 && requested.length <= 50,
    "Add at least one item to your bag",
  );
  const combined = new Map();
  for (const line of requested) {
    const productId = text(line.productId, 100);
    const variantId = line.variantId || "50ml";
    check(
      productId && ["50ml", "100ml"].includes(variantId),
      "Choose a valid product size",
    );
    check(
      Number.isSafeInteger(line.quantity) &&
        line.quantity > 0 &&
        line.quantity <= 20,
      "Quantity must be between 1 and 20",
    );
    const key = `${productId}:${variantId}`;
    const quantity = (combined.get(key)?.quantity || 0) + line.quantity;
    check(quantity <= 20, "Maximum quantity per size is 20");
    combined.set(key, { productId, variantId, quantity });
  }
  const items = [];
  for (const line of combined.values()) {
    const base = await get("products", line.productId);
    const product = productForSize(base, line.variantId);
    check(
      product?.status === "active" && product.pricePaise > 0,
      "A product in your bag is unavailable",
      409,
    );
    check(
      product.stock >= line.quantity,
      `Insufficient stock for ${product.name} (${product.sizeLabel})`,
      409,
    );
    items.push({
      productId: product.id,
      productName: `${product.name} · ${product.sizeLabel}`,
      name: product.name,
      image: product.image,
      variantId: line.variantId,
      sizeLabel: product.sizeLabel,
      sku: product.sku,
      quantity: line.quantity,
      unitPricePaise: product.pricePaise,
      subtotalPaise: product.pricePaise * line.quantity,
      weight: base.weight || 0,
      length: base.length || 0,
      breadth: base.breadth || 0,
      height: base.height || 0,
    });
  }
  return items;
}

export async function adjustCheckoutStock(items, direction) {
  for (const item of items) {
    const product = await get("products", item.productId);
    if (!product) continue;
    const key = item.variantId === "100ml" ? "stock100" : "stock";
    const stock = product[key] || 0;
    if (direction < 0)
      check(
        stock >= item.quantity,
        `Insufficient stock for ${item.name} (${item.sizeLabel})`,
        409,
      );
    await put("products", {
      ...product,
      [key]: stock + direction * item.quantity,
    });
  }
}

export function legacyOrderFields(items) {
  const first = items[0];
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    productId: first.productId,
    productName: items.map((item) => item.productName).join(" + "),
    variantId: first.variantId,
    sizeLabel: first.sizeLabel,
    sku: first.sku,
    quantity,
    unitPricePaise: first.unitPricePaise,
    items,
    subtotalPaise: items.reduce((sum, item) => sum + item.subtotalPaise, 0),
  };
}
