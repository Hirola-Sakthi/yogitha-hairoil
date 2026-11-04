import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { useStore } from "./StoreContext";
import { money } from "../shared/api";
import { imageUrl } from "../shared/imageUrl";
import "./cart-page.css";

export default function CartPage() {
  const { cart, cartBusy, cartError, setCartQuantity, refreshCart } = useStore();
  useEffect(() => { refreshCart().catch(() => {}); }, [refreshCart]);
  const change = (p, quantity) => setCartQuantity(p.productId, quantity, p.variantId).catch(() => {});
  return <section className="commerce-page bag-page" aria-labelledby="bag-title">
    <Link className="bag-back" to="/shop"><ArrowLeft size={17} /> Continue shopping</Link>
    <div className="bag-heading">
    <div><p className="eyebrow">SELECTED WITH CARE</p>
    <h1 id="bag-title">Your shopping bag.</h1>
    </div><p className="bag-count" aria-live="polite"><ShoppingBag size={18} />{cart.count} {cart.count === 1 ? "item" : "items"}</p>
    </div>
    {cartError && <p className="store-error" role="alert">{cartError}</p>}
    {!cart.items.length ? <>
      <div className="bag-empty-page" aria-busy={cartBusy}>
        <div className="bag-empty-copy">
          <span className="bag-empty-bag-mark" aria-hidden="true"><ShoppingBag size={25} strokeWidth={1.25} /></span>
          <h2>{cartBusy ? "Loading your bag…" : "A little care starts here."}</h2>
          <span className="bag-empty-flourish" aria-hidden="true" />
          <p>{cartBusy ? "Checking your saved items." : "Your bag is empty. Explore our hair oil and choose your perfect size."}</p>
          <Link className="store-btn" to="/shop">Explore our collection <ArrowRight size={15} /></Link>
        </div>
      </div>
      <div className="bag-benefits" aria-label="Our care commitments">
        <div className="bag-benefit"><span><strong>Natural Ingredients</strong><small>Gentle. Pure. Effective.</small></span></div>
        <div className="bag-benefit"><span><strong>Nourishing Care</strong><small>For stronger, healthier hair.</small></span></div>
        <div className="bag-benefit"><span><strong>Made with Purpose</strong><small>Thoughtful in every drop.</small></span></div>
      </div>
    </> : <div className="bag-page-grid">
      <div className="bag-page-items" aria-busy={cartBusy}>
        <div className="bag-items-heading"><span>Your selection</span><span>Amount</span></div>
        {cart.items.map(p => <article className="bag-page-item" key={`${p.productId}-${p.variantId}`}>
          <img src={imageUrl(p.image || "/product-showcase.webp")} alt={p.name} width="160" height="180" />
          <div className="bag-page-item-copy">
            <span className="bag-product-brand">DR. YOGITHA’S</span>
            <h2>{p.name}</h2><span className="bag-size">{p.sizeLabel || (p.variantId === "100ml" ? "100 ml" : "50 ml")}</span><p>{money(p.pricePaise)} each</p>
            {!p.available && <p className="store-error">This quantity is no longer available. Update or remove this item.</p>}
            <div className="bag-item-controls"><div className="cart-quantity">
              <button disabled={cartBusy || p.quantity <= 1} aria-label={`Remove one ${p.name}`} onClick={() => change(p, p.quantity - 1)}><Minus size={14} /></button>
              <span>{p.quantity}</span>
              <button disabled={cartBusy || p.quantity >= Math.min(20, p.stock)} aria-label={`Add one ${p.name}`} onClick={() => change(p, p.quantity + 1)}><Plus size={14} /></button>
            </div>
            <button className="cart-remove" disabled={cartBusy} aria-label={`Remove ${p.name} from bag`} onClick={() => change(p, 0)}><Trash2 size={15} /> Remove</button></div>
          </div><strong className="bag-line-total">{money(p.totalPaise)}</strong>
        </article>)}
      </div>
      <aside className="bag-summary" aria-label="Bag summary">
        <div className="bag-summary-heading"><h2>Order summary</h2></div>
        <div><span>Subtotal</span><strong>{money(cart.subtotalPaise)}</strong></div>
        <div><span>Shipping</span><span>At checkout</span></div>
        <div className="bag-summary-total"><span>Bag subtotal</span><strong>{money(cart.subtotalPaise)}</strong></div>
        {cart.items.length > 0 && cart.items.every(item => item.available) && <Link className="store-btn bag-checkout" aria-disabled={cartBusy} onClick={e => { if (cartBusy) e.preventDefault(); }} to="/checkout?cart=1">Proceed to checkout <ArrowRight size={17} /></Link>}
        <div className="bag-shipping-note">Shipping and your final total will be shown at checkout.</div>
        <div className="bag-summary-flourish" aria-hidden="true" />
        <Link className="store-btn secondary" to="/shop">Continue shopping</Link>
      </aside>
    </div>}
  </section>;
}
