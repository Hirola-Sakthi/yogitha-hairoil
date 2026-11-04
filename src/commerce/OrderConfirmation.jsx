import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock3, Leaf, Package } from "lucide-react";
import { money } from "../shared/api";
import { imageUrl } from "../shared/imageUrl";
import "./order-confirmation.css";

export default function OrderConfirmation({ order, product, preview }) {
  const paid = order.paymentStatus === "paid";
  const pending = order.paymentMethod === "razorpay" && !paid;
  const items = order.items?.length ? order.items : [{
    productName: order.productName || product?.name || "Ayurvedic Hair Oil",
    image: product?.image,
    quantity: order.quantity || 1,
  }];
  return (
    <section className="confirmation-page" aria-labelledby="confirmation-title">
      <div className="confirmation-card">
        <header className="confirmation-header">
          <span className="confirmation-brand"><Leaf size={18} /> DR. YOGITHA’S</span>
          <div className="confirmation-symbol">{pending ? <Clock3 size={34} strokeWidth={1.5} /> : <Check size={38} strokeWidth={1.5} />}</div>
          <p className="confirmation-status">{preview ? "PREVIEW ORDER" : pending ? "PAYMENT PROCESSING" : paid ? "PAYMENT SUCCESSFUL" : "ORDER CONFIRMED"}</p>
          <h1 id="confirmation-title">{pending ? "Just one more moment." : "Thank you for your order."}</h1>
          <p className="confirmation-message">{preview ? "Your sample order is saved. No real order or payment was made." : pending ? "Your payment is awaiting confirmation. You can check its status in your account." : paid ? "Your payment is confirmed. Your next moment of care starts here." : "Your order is confirmed. You can pay when it arrives."}</p>
        </header>
        <div className="confirmation-body">
          <div className="confirmation-reference"><span>Order number</span><strong>{order.id}</strong></div>
          <div className="confirmation-items">
            {items.map((item, index) => <div className="confirmation-product" key={`${item.productId || index}-${item.variantId || "item"}`}>
              <img src={imageUrl(item.image || product?.image || "/product-showcase.webp")} alt={item.productName || "Ayurvedic hair oil"} />
              <div><span>YOUR SELECTION</span><h2>{item.productName}</h2><p>Quantity {item.quantity || 1}</p></div>
              {index === 0 && <Package size={22} strokeWidth={1.3} aria-hidden="true" />}
            </div>)}
          </div>
          <dl className="confirmation-totals">
            {Number.isFinite(order.subtotalPaise) && <div><dt>Subtotal</dt><dd>{money(order.subtotalPaise)}</dd></div>}
            {Number.isFinite(order.shippingPaise) && <div><dt>Shipping</dt><dd>{money(order.shippingPaise)}</dd></div>}
            <div><dt>Payment method</dt><dd>{order.paymentMethod === "razorpay" ? "Razorpay" : "Cash on delivery"}</dd></div>
            <div className="confirmation-total"><dt>{paid ? "Amount paid" : pending ? "Order total" : "Pay on delivery"}</dt><dd>{money(order.totalPaise)}</dd></div>
          </dl>
          <div className="confirmation-next"><span><Package size={18} /></span><div><h3>{pending ? "Follow your payment status" : "Stay close to your order"}</h3><p>View your order details and follow delivery updates in your account.</p></div></div>
          <div className="confirmation-actions"><Link className="confirmation-primary" to="/account">View my orders <ArrowRight size={18} /></Link><Link className="confirmation-secondary" to="/shop">Continue shopping</Link></div>
        </div>
      </div>
    </section>
  );
}
