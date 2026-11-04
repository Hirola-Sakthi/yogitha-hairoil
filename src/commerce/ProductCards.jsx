import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ShoppingBag } from "lucide-react";
import { useStore } from "./StoreContext";
import { money } from "../shared/api";
import { productForSize } from "../shared/productOptions";
import { imageUrl } from "../shared/imageUrl";
import "./product-cards.css";

export function AddToCartButton({ product, quantity = 1, showFeedback = true }) {
  const { addToCart, cartBusy } = useStore();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="collection-action">
    <button className="collection-add" disabled={cartBusy || product.stock < quantity || !product.pricePaise || busy}
      onClick={async () => {
        setBusy(true); setError(""); setMessage("");
        try { await addToCart(product.id, quantity, product.variantId); setMessage(`${quantity} × ${product.sizeLabel || "50 ml"} added to your bag`); }
        catch (e) { setError(e.message); }
        finally { setBusy(false); }
      }}>
      {message ? <Check size={17} /> : <ShoppingBag size={17} />}
      {busy ? "Adding…" : product.stock < quantity ? "Out of stock" : "Add to cart"}
    </button>
    {showFeedback && message && <small className="collection-feedback" role="status">{message}</small>}
    {error && <small className="collection-error" role="alert">{error}</small>}
  </div>;
}

export function ProductCard({ product }) {
  const [size, setSize] = useState("50ml");
  const p = productForSize(product, size);
  const discount = p.compareAtPricePaise > p.pricePaise
    ? Math.round((1 - p.pricePaise / p.compareAtPricePaise) * 100) : 0;
  return <article className="collection-card">
    <Link className="collection-image" to={`/products/${p.slug}`} aria-label={`View ${p.name}`}>
      <img src={imageUrl(p.image || "/product-showcase.webp")} alt={p.name} loading="lazy"
        onError={e => { e.currentTarget.onerror = null; if (!e.currentTarget.src.endsWith("/product-showcase.webp")) e.currentTarget.src = imageUrl("/product-showcase.webp"); }} />
      {discount > 0 && <span className="collection-discount">{discount}% off</span>}
      <span className="collection-explore" aria-hidden="true"><ArrowUpRight size={20} /></span>
    </Link>
    <div className="collection-card-copy">
      <p className="collection-card-label">THE EVERYDAY RITUAL</p>
      <h3><Link to={`/products/${p.slug}`}>{p.name}</Link></h3>
      <p className="collection-description">{p.description}</p>
      <div className="collection-price"><strong>{money(p.pricePaise)}</strong>
        {discount > 0 && <del aria-label={`Original price ${money(p.compareAtPricePaise)}`}>{money(p.compareAtPricePaise)}</del>}
      </div>
      <SizeOptions value={size} onChange={setSize} />
      <AddToCartButton key={size} product={p} />
    </div>
  </article>;
}

export default function ProductCollection() {
  const { data, error } = useStore();
  const product = data?.products.find(p => p.id === "hair-oil") || data?.products[0];
  return <section id="shop" className="home-collection single-product-section" aria-label="Shop our hair oil" tabIndex={-1}>
    {error && !data ? <p className="collection-empty" role="alert">We couldn’t load the collection. Please try again shortly.</p>
      : !data ? <p className="collection-empty" role="status">Loading our collection…</p>
      : product ? <ProductPurchase key={product.id} product={product} />
      : <p className="collection-empty">Our collection is coming soon. A little care is on its way.</p>}
  </section>;
}

export function SizeOptions({ value, onChange }) {
  return <fieldset className="oil-sizes"><legend>Size <span>— {value === "100ml" ? "100 ml" : "50 ml"}</span></legend>
    {["50ml", "100ml"].map(size => <button type="button" key={size} aria-pressed={size === value} onClick={() => onChange(size)}>{size === "50ml" ? "50 ml" : "100 ml"}</button>)}
  </fieldset>;
}

export function ProductPurchase({ product }) {
  const [size, setSize] = useState("50ml");
  const [quantity, setQuantity] = useState(1);
  const p = productForSize(product, size);
  const available = p.pricePaise > 0 && p.stock > 0;
  const qty = Math.min(quantity, Math.max(1, Math.min(20, p.stock)));
  const discount = p.compareAtPricePaise > p.pricePaise && p.pricePaise > 0 ? Math.floor((1 - p.pricePaise / p.compareAtPricePaise) * 100) : 0;
  const changeSize = next => { setSize(next); setQuantity(1); };
  return <div className="oil-purchase">
    <div className="oil-gallery">
      {product.image100 && product.image100 !== product.image && <div className="oil-thumbnails">
        {["50ml", "100ml"].map(v => <button key={v} type="button" aria-label={`View ${v === "50ml" ? "50 ml" : "100 ml"} bottle`} aria-pressed={size === v} onClick={() => changeSize(v)}><img src={imageUrl(productForSize(product, v).image)} alt="" /></button>)}
      </div>}
      <div className="oil-main-image"><img src={imageUrl(p.image || "/product-showcase.webp")} alt={`${p.name} — ${p.sizeLabel}`} loading="lazy" />
      </div>
    </div>
    <div className="oil-details">
      <p className="eyebrow">DR. YOGITHA’S · BOTANICAL HAIR CARE</p>
      <h2>{p.name}</h2>
      <p className="oil-intro">{p.description}</p>
      <div className="oil-pricing" aria-live="polite"><strong>{p.pricePaise > 0 ? money(p.pricePaise) : "Coming soon"}</strong>
        {discount > 0 && <><del>{money(p.compareAtPricePaise)}</del><span>{discount}% off</span></>}
      </div>
      <div className="oil-selection-row">
        <SizeOptions value={size} onChange={changeSize} />
        <div className="oil-stock-quantity">
          <p className="oil-stock" aria-live="polite">{available ? (p.stock <= 5 ? `Only ${p.stock} left in this size` : "In stock · ready for your routine") : "This size is currently unavailable"}</p>
          <div className="oil-quantity" aria-label="Quantity">
            <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQuantity(qty - 1)}>−</button>
            <output aria-live="polite">{qty}</output>
            <button type="button" aria-label="Increase quantity" disabled={!available || qty >= Math.min(20, p.stock)} onClick={() => setQuantity(qty + 1)}>+</button>
          </div>
        </div>
      </div>
      <div className="oil-purchase-actions">
        <AddToCartButton key={`${p.id}-${size}-${qty}`} product={p} quantity={qty} showFeedback={false} />
        {available ? <Link className="oil-buy-now" to={`/checkout?product=${encodeURIComponent(p.id)}&variant=${size}&quantity=${qty}`}>Buy now <ArrowUpRight size={17} /></Link>
          : <button className="oil-buy-now" disabled>Buy now</button>}
      </div>      <div className="oil-purchase-note"><ShoppingBag size={17} /><span>Choose your size. Make it part of your everyday ritual.</span></div>
      <p className="oil-sku">SKU {p.sku} <span>Shipping calculated at checkout</span></p>
    </div>
  </div>;
}
