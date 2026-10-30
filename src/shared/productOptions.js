export function productForSize(product, variantId = "50ml") {
  if (!product || !["50ml", "100ml"].includes(variantId)) return null;
  const large = variantId === "100ml";
  return {
    ...product,
    variantId,
    sizeLabel: large ? "100 ml" : "50 ml",
    pricePaise: large ? product.price100Paise || 0 : product.pricePaise,
    compareAtPricePaise: large ? product.compareAt100Paise || 0 : product.compareAtPricePaise,
    stock: large ? product.stock100 || 0 : product.stock,
    image: large ? product.image100 || product.image : product.image,
    sku: `${product.sku}-${large ? "100ML" : "50ML"}`,
  };
}
