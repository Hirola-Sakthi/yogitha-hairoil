import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CreditCard,
  Leaf,
  Package,
  Truck,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  Clock3,
  ShoppingBag,
  BadgeCheck,
} from "lucide-react";
import { api, preview, money, date, requestId } from "../shared/api";
import { useStore } from "./StoreContext";
import { ProductCard, ProductPurchase } from "./ProductCards";
import "./commerce.css";
import "./journal.css";
import "./checkout.css";
import "./contact.css";
import "./store-auth.css";
import OrderConfirmation from "./OrderConfirmation";
import { productForSize } from "../shared/productOptions";
import { imageUrl } from "../shared/imageUrl";
import { storeContact } from "../shared/storeDefaults";
import DOMPurify from "dompurify";
export function Frame({ eyebrow, title, children, className = "" }) {
  return (
    <section className={`commerce-page ${className}`}>
      <p className="eyebrow">{eyebrow || "DR. YOGITHA’S"}</p>
      <h1>{title}</h1>
      {children}
    </section>
  );
}
export function AuthPage({ mode = "login" }) {
  const { setUser } = useStore();
  const navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setError("");
    setMessage("");
    setShowPassword(false);
  }, [mode]);
  const nextParam = new URLSearchParams(location.search).get("next"),
    next =
      nextParam?.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/account";
  return (
    <section className="store-auth-page" aria-labelledby="store-auth-title">
      <div className="store-auth-shell">
      <aside className="store-auth-art">
        <img src={imageUrl("/admin-login-nature.png")} alt="Dr. Yogitha’s Ayurvedic hair oil with fresh botanicals" />
        <div className="store-auth-brand"><Leaf size={28} strokeWidth={1.4} /><div><span>DR. YOGITHA’S</span><p>Ayurvedic herbal care.</p></div></div>
      </aside>
      <div className="auth-card store-auth-card">
        <span className="store-auth-mark"><Leaf size={23} strokeWidth={1.4} /></span>
        <p className="store-auth-eyebrow">YOUR PERSONAL SPACE</p>
        <h1 id="store-auth-title">{{ login: "Welcome back.", register: "A little care starts here.", forgot: "Forgot your password?", reset: "A fresh start." }[mode]}</h1>
        {preview && mode === "login" && (
          <button
            className="store-btn secondary"
            onClick={async () => {
              const r = await api("/auth/login", {
                method: "POST",
                body: { email: "customer@example.com" },
              });
              setUser(r.user);
              navigate(next);
            }}
          >
            Try customer preview <ArrowRight size={16} />
          </button>
        )}
        <p>
          {mode === "login"
            ? "Sign in with your email and password to place an order."
            : mode === "register"
              ? "Create your account to shop and follow your orders."
              : mode === "forgot"
                ? "Request a password reset link by email."
                : "Choose a strong password."}
        </p>
        <form
          className="store-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setMessage("");
            try {
              const r = await api("/auth/" + mode, {
                method: "POST",
                body: {
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                  token: new URLSearchParams(location.search).get("token"),
                },
              });
              if (r.user) {
                setUser(r.user);
                navigate(next);
              } else setMessage(r.message);
            } catch (x) {
              setError(x.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "register" && (
            <label>
              Your name
              <span className="store-auth-input"><UserRound size={17} aria-hidden="true" /><input name="name" placeholder="Your full name" autoComplete="name" required /></span>
            </label>
          )}
          {mode !== "reset" && (
            <label>
              Email address
              <span className="store-auth-input"><Mail size={17} aria-hidden="true" /><input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></span>
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <span className="store-auth-input"><LockKeyhole size={17} aria-hidden="true" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                minLength="10"
                maxLength="128"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              <button type="button" className="store-auth-eye" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
              {mode !== "login" && <small>Use at least 10 characters.</small>}
            </label>
          )}
          {error && (
            <p className="store-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="store-success" role="status">
              {message}
            </p>
          )}
          <button className="store-btn" disabled={busy}>
            {busy
              ? "Please wait…"
              : {
                  login: "Sign in",
                  register: "Create account",
                  forgot: "Send reset link",
                  reset: "Update password",
                }[mode]}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-links">
          {mode === "login" ? (
            <>
              <Link to={"/register?next=" + encodeURIComponent(next)}>
                New here? Create an account
              </Link>
              <Link to="/forgot-password">Forgot password?</Link>
            </>
          ) : (
            <Link to={"/login?next=" + encodeURIComponent(next)}>
              Back to sign in
            </Link>
          )}
        </div>
        <Link className="store-auth-home" to="/">Back to storefront <ArrowRight size={14} /></Link>
      </div>
      </div>
    </section>
  );
}
export function ShopPage() {
  const { data, error } = useStore();
  return (
    <Frame eyebrow="THE COLLECTION" title="A ritual, made for you.">
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p>Loading the collection…</p>
      ) : data.products.length ? (
        <div className="collection-grid">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="store-empty">
          <Leaf size={32} />
          <h2>Our collection is getting ready.</h2>
          <p>
            Confirmed product details and availability will be published here.
          </p>
          <Link className="store-btn" to="/contact">
            Get in touch <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </Frame>
  );
}
export function ProductPage() {
  const { slug } = useParams(),
    { data, error } = useStore();
  const p = data?.products.find((p) => p.slug === slug);
  if (!data)
    return (
      <Frame title="Loading product…">
        <p>{error}</p>
      </Frame>
    );
  if (!p)
    return (
      <Frame title="Product unavailable">
        <Link to="/shop">Explore the collection</Link>
      </Frame>
    );
  return (
    <Frame eyebrow="THE COLLECTION" title={p.name}>
      <ProductPurchase key={p.id} product={p} />
      {p.faq?.length > 0 && (
        <section className="product-faq" id="product-questions" tabIndex={-1}>
          <h2>A few things to know.</h2>
          {p.faq.map((f, i) => (
            <details key={i}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      )}
      <section className="product-faq">
        <h2>Customer reviews</h2>
        {data.reviews.filter((r) => r.productId === p.id).length ? (
          data.reviews
            .filter((r) => r.productId === p.id)
            .map((r) => (
              <article className="review-card" key={r.id}>
                <strong>
                  {r.name} · {r.rating}/5
                </strong>
                <p>{r.content}</p>
              </article>
            ))
        ) : (
          <p>No published reviews yet. Customers can review after delivery.</p>
        )}
      </section>
    </Frame>
  );
}
let razorpayScriptPromise;
function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Unable to load Razorpay Checkout. Please try again."));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}
export function CheckoutPage() {
  const { data, user, error, refreshCart, cart, cartBusy } = useStore(),
    location = useLocation();
  const q = new URLSearchParams(location.search),
    cartMode = q.get("cart") === "1",
    queryProduct = productForSize(data?.products.find((p) => p.id === q.get("product")), q.get("variant") || "50ml"),
    qty = Math.max(1, Math.min(20, Number(q.get("quantity")) || 1));
  const checkoutItems = cartMode
    ? cart.items
    : queryProduct
      ? [{ productId: queryProduct.id, variantId: queryProduct.variantId, quantity: qty, name: queryProduct.name, sizeLabel: queryProduct.sizeLabel, pricePaise: queryProduct.pricePaise, image: queryProduct.image }]
      : [];
  const checkoutSignature = checkoutItems.map(item => `${item.productId}:${item.variantId}:${item.quantity}`).join("|");
  const p = cartMode && checkoutItems.length
    ? productForSize(data?.products.find(product => product.id === checkoutItems[0].productId), checkoutItems[0].variantId)
    : queryProduct;
  const subtotalPaise = checkoutItems.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
  const key = useRef(requestId()),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false),
    [paymentMethod, setPaymentMethod] = useState(""),
    [deliveryPincode, setDeliveryPincode] = useState(""),
    [shippingQuote, setShippingQuote] = useState(null),
    [shippingBusy, setShippingBusy] = useState(false),
    [shippingError, setShippingError] = useState(""),
    [success, setSuccess] = useState(null);
  const selectedPaymentMethod =
    paymentMethod || (data?.checkout.cod ? "cod" : "razorpay");
  useEffect(() => {
    setShippingQuote(null);
    setShippingError("");
    if (!/^\d{6}$/.test(deliveryPincode) || !checkoutItems.length || !user) return undefined;
    let live = true;
    setShippingBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const quote = preview
          ? { shippingPaise: data?.settings?.shippingPaise || 0, courierName: "Preview shipping" }
          : await api("/shipping/quote", {
              method: "POST",
              body: {
                items: checkoutItems.map(item => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
                address: { pincode: deliveryPincode },
                paymentMethod: selectedPaymentMethod,
              },
            });
        if (live) setShippingQuote(quote);
      } catch (quoteError) {
        if (live) setShippingError(quoteError.message);
      } finally {
        if (live) setShippingBusy(false);
      }
    }, 350);
    return () => { live = false; window.clearTimeout(timer); };
  }, [deliveryPincode, checkoutSignature, selectedPaymentMethod, user, data, preview]);
  if (user === undefined || !data)
    return (
      <Frame title="Preparing checkout…">
        <p>{error}</p>
      </Frame>
    );
  if (success) return <OrderConfirmation order={success} product={p} preview={preview} />;
  if (cartMode && cartBusy)
    return <Frame title="Preparing your order…"><p>Checking the items in your bag.</p></Frame>;
  if (cartMode && !checkoutItems.length)
    return <Frame title="Your bag is empty."><Link className="store-btn" to="/cart">Return to your bag</Link></Frame>;
  if (!user)
    return (
      <section className="checkout-signin-page" aria-labelledby="checkout-signin-title">
        <div className="checkout-signin-card">
        <span className="checkout-signin-icon"><LockKeyhole size={28} strokeWidth={1.4} /></span>
        <p className="checkout-signin-eyebrow">ONE STEP BEFORE CHECKOUT</p>
        <h1 id="checkout-signin-title">Your care is almost yours.</h1>
        <p className="checkout-signin-description">Sign in to place your order and keep your delivery updates in one place.</p>
        {checkoutItems.map(item => <div className="checkout-signin-product" key={`${item.productId}-${item.variantId}`}>
          <img src={imageUrl(item.image || "/product-showcase.webp")} alt={item.name} />
          <div><h2>{item.name}</h2><p>{item.sizeLabel} · Quantity {item.quantity}</p></div>
          <strong>{money(item.pricePaise * item.quantity)}</strong>
        </div>)}
        <Link
          className="store-btn"
          to={
            "/login?next=" +
            encodeURIComponent(location.pathname + location.search)
          }
        >
          Sign in to continue <ArrowRight size={17} />
        </Link>
        <p className="checkout-signin-register">New here? <Link to={"/register?next=" + encodeURIComponent(location.pathname + location.search)}>Create an account</Link></p>
        <Link className="checkout-signin-back" to="/cart">Back to your bag</Link>
        </div>
      </section>
    );
  if (!p)
    return (
      <Frame title="Choose your product first.">
        <Link className="store-btn" to="/shop">
          Explore the collection
        </Link>
      </Frame>
    );
  return (
    <Frame className="premium-checkout" eyebrow="THE FINAL STEP" title="Checkout">
      <div className="checkout-intro"><p>A few details, and your care is on its way.</p><Link to="/cart">Back to your bag <ArrowRight size={16} /></Link></div>
      <div className="checkout-grid">
        <form
          className="store-form checkout-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setFailure("");
            const formData = Object.fromEntries(new FormData(e.currentTarget));
            const orderItems = checkoutItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }));
            try {
              if (selectedPaymentMethod === "razorpay") {
                key.current = requestId();
                const checkoutOrder = await api("/payments/razorpay/order", {
                  method: "POST",
                  body: {
                    items: orderItems,
                    address: formData,
                    idempotencyKey: key.current,
                  },
                });
                await loadRazorpayCheckout();
                const checkout = new window.Razorpay({
                  key: checkoutOrder.keyId,
                  order_id: checkoutOrder.orderId,
                  amount: checkoutOrder.amount,
                  currency: checkoutOrder.currency,
                  name: data.settings.brand || "Dr. Yogitha's",
                  description: cartMode ? `${orderItems.length} items` : p.name,
                  prefill: {
                    name: formData.name,
                    email: user.email,
                    contact: formData.phone,
                  },
                  theme: { color: "#344c35" },
                  handler: async (response) => {
                    try {
                      const result = await api("/payments/razorpay/verify", {
                        method: "POST",
                        body: response,
                      });
                      setSuccess(result.order || result);
                      refreshCart().catch(() => {});
                    } catch (verificationError) {
                      setFailure(verificationError.message);
                    } finally {
                      setBusy(false);
                    }
                  },
                  modal: { ondismiss: () => setBusy(false) },
                });
                checkout.on("payment.failed", (response) => {
                  setFailure(
                    response.error?.description ||
                      "Razorpay could not complete the payment.",
                  );
                  setBusy(false);
                });
                checkout.open();
              } else {
                setSuccess(
                  await api("/orders", {
                    method: "POST",
                    body: {
                      items: orderItems,
                      paymentMethod: "cod",
                      address: formData,
                      idempotencyKey: key.current,
                    },
                  }),
                );
                refreshCart().catch(() => {});
                setBusy(false);
              }
            } catch (x) {
              setFailure(x.message);
              setBusy(false);
            }
          }}
        >
          <div className="checkout-section-heading"><span>01</span><div><h2>Delivery details</h2><p>Where should we send your order?</p></div><MapPin size={22} /></div>
          <p className="checkout-account"><Mail size={16} />{user.email}</p>
          <div className="checkout-fields">
            {[
              ["name", "Full name", "Enter your full name", "name"],
              ["phone", "Mobile number", "10-digit mobile number", "tel-national"],
              ["line1", "Address line 1", "House number, building and street", "address-line1"],
              ["line2", "Address line 2 (optional)", "Apartment, area or landmark", "address-line2"],
              ["city", "City", "e.g. Bengaluru", "address-level2"],
              ["state", "State", "e.g. Karnataka", "address-level1"],
              ["pincode", "PIN code", "6-digit PIN code", "postal-code"],
            ].map(([k, l, placeholder, autoComplete]) => (
              <label className={k === "pincode" ? "checkout-field-wide" : ""} key={k}>
                {l}
                <input
                  name={k}
                  placeholder={placeholder}
                  {...(k === "pincode" ? { value: deliveryPincode, onChange: e => setDeliveryPincode(e.target.value.replace(/\D/g, "").slice(0, 6)) } : {})}
                  autoComplete={autoComplete}
                  type={k === "phone" ? "tel" : "text"}
                  {...(k === "name" ? { defaultValue: user.name } : {})}
                  required={k !== "line2"}
                  pattern={
                    k === "phone"
                      ? "[6-9][0-9]{9}"
                      : k === "pincode"
                        ? "[0-9]{6}"
                        : undefined
                  }
                  inputMode={
                    ["phone", "pincode"].includes(k) ? "numeric" : undefined
                  }
                  maxLength={k === "phone" ? 10 : k === "pincode" ? 6 : 200}
                />
              </label>
            ))}
          </div>
          <fieldset className="checkout-payment-options">
            <legend><span className="checkout-step">02</span>Payment method</legend>
            {data.checkout.cod && (
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={selectedPaymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <Truck size={19} />
                <span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span>
              </label>
            )}
            {data.checkout.onlinePayments && (
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={selectedPaymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />
                <CreditCard size={19} />
                <span><strong>Pay online with Razorpay</strong><small>{data.checkout.razorpayMode === "test" ? "Test mode — no real payment will be taken." : "UPI, cards and net banking."}</small></span>
              </label>
            )}
            {!data.checkout.cod && !data.checkout.onlinePayments && (
              <p className="store-error">Checkout is not open yet. Please contact the store.</p>
            )}
          </fieldset>
          {failure && (
            <p className="store-error" role="alert">
              {failure}
            </p>
          )}
          <p className="store-muted">
            Please review our{" "}
            {data.policies.length
              ? data.policies.map((p, i) => (
                  <span key={p.id}>
                    {i ? ", " : ""}
                    <Link target="_blank" to={"/policies/" + p.slug}>
                      {p.title}
                    </Link>
                  </span>
                ))
              : "policies with the store before ordering."}
          </p>
          <button className="store-btn" disabled={busy || shippingBusy || !shippingQuote || (!data.checkout.cod && !data.checkout.onlinePayments)}>
            {busy
              ? selectedPaymentMethod === "razorpay" ? "Opening secure checkout…" : "Placing order…"
              : selectedPaymentMethod === "razorpay"
                ? "Pay securely"
                : preview
                ? "Place sample order"
                : "Place order"}
            <ArrowRight size={16} />
          </button>
        </form>
        <aside className="order-summary">
          <div className="checkout-summary-heading"><h2>Your order</h2><Leaf size={24} strokeWidth={1.3} /></div>
          {checkoutItems.map(item => <div className="checkout-summary-product" key={`${item.productId}-${item.variantId}`}>
            <img src={imageUrl(item.image || "/product-showcase.webp")} alt={item.name} />
            <div><span className="checkout-brand">DR. YOGITHA&apos;S</span><h3>{item.name}</h3><p>{item.sizeLabel} &middot; Quantity {item.quantity}</p></div>
            <strong>{money(item.pricePaise * item.quantity)}</strong>
          </div>)}
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotalPaise)}</strong>
          </div>
          <div>
            <span>Shipping</span>
            <strong>{shippingBusy ? "Calculating…" : shippingQuote ? money(shippingQuote.shippingPaise) : "Enter PIN code"}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>
              {money(subtotalPaise + (shippingQuote?.shippingPaise || 0))}
            </strong>
          </div>
          {shippingError && <p className="store-error" role="alert">{shippingError}</p>}
          {shippingQuote?.courierName && <p className="checkout-shipping-estimate">Rate via {shippingQuote.courierName}{shippingQuote.estimatedDays ? ` · Estimated ${shippingQuote.estimatedDays} days` : ""}</p>}
          <p>Availability and totals are confirmed when you place the order.</p>
        </aside>
      </div>
    </Frame>
  );
}
export function AccountPage() {
  const { user, setUser } = useStore(),
    [orders, setOrders] = useState([]),
    [refunds, setRefunds] = useState([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user)
      Promise.all([api("/orders"), api("/account/refunds")])
        .then(([o, r]) => {
          setOrders(o);
          if (o[0]) setSelected(o[0].id);
          setRefunds(r);
        })
        .catch((e) => setError(e.message));
  }, [user]);
  if (user === undefined) return <Frame title="Loading your account…" />;
  if (!user)
    return (
      <Frame className="account-welcome" title="Your account awaits.">
        <div className="account-welcome-card">
          <p>Sign in to view your orders and manage your account.</p>
          <Link className="store-btn" to="/login">Sign in <ArrowRight size={16} /></Link>
          <span>New here? <Link to="/register">Create an account</Link></span>
        </div>
      </Frame>
    );
  return (
    <Frame eyebrow="YOUR PERSONAL SPACE" title={"Hello, " + user.name + "."}>
      <div className="account-toolbar">
        <span>{user.email}</span>
        <button
          onClick={async () => {
            await api("/auth/logout", { method: "POST" });
            setUser(null);
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      {error && (
        <p className="store-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="store-success" role="status">
          {message}
        </p>
      )}
      <h2 className="section-title">Your orders</h2>
      {orders.length ? (
        orders.map((o) => {
          const items = o.items?.length ? o.items : [{ productName: o.productName, quantity: o.quantity, image: o.image }];
          return (
          <article className="account-order" key={o.id}>
            <div className="account-order-heading">
              <span className="store-muted">
                {date(o.createdAt)} · Order ID: {o.id}
              </span>
              <h3>{items.length > 1 ? `${items.length} products` : items[0].productName}</h3>
            </div>
            <span className="order-status">{o.status.replaceAll("_", " ")}</span>
            <div className="account-order-items">
              {items.map((item, index) => <div className="account-order-item" key={`${item.productName}-${index}`}>
                <img src={imageUrl(item.image || "/product-showcase.webp")} alt="" />
                <span>{item.productName} <small>× {item.quantity}</small></span>
              </div>)}
              <strong className="account-order-total">{money(o.totalPaise)}</strong>
              <button
                className="store-link"
                onClick={() => setSelected(selected === o.id ? null : o.id)}
                aria-expanded={selected === o.id}
              >
                View details <ArrowRight size={15} />
              </button>
            </div>
            {selected === o.id && (
              <div className="account-order-detail">
                <div className="account-order-facts">
                <p><CreditCard size={16} aria-hidden="true" /><span><strong>Payment method</strong><br />{o.paymentStatus} · {o.paymentMethod}</span></p>
                <p><MapPin size={16} aria-hidden="true" /><span><strong>Deliver to</strong><br />{Object.values(o.address || {}).filter(Boolean).join(", ")}</span></p>
                <p><Package size={16} aria-hidden="true" /><span><strong>Placed on</strong><br />{date(o.createdAt)}</span></p>
                {o.shipment?.awb && (
                  <p><Truck size={16} aria-hidden="true" /><span><strong>Tracking</strong><br />AWB {o.shipment.awb} · {o.shipment.courier}</span></p>
                )}
                {o.shipment?.trackingStatus && (
                  <p><Truck size={16} aria-hidden="true" /><span><strong>Latest tracking update</strong><br />{o.shipment.trackingStatus}</span></p>
                )}
                {o.timeline.map((t, i) => (
                  <p className="account-order-timeline-entry" key={i}>
                    {t.status === "awaiting_payment" ? <Clock3 size={15} aria-hidden="true" /> : t.status === "placed" ? <ShoppingBag size={15} aria-hidden="true" /> : t.status === "confirmed" ? <BadgeCheck size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                    <span>{t.status.replaceAll("_", " ")} — {date(t.at)}</span>
                  </p>
                ))}
                </div>
                <div className="account-order-actions">
                {o.status === "delivered" && (
                  <form
                    className="store-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        const d = Object.fromEntries(
                          new FormData(e.currentTarget),
                        );
                        await api("/reviews", {
                          method: "POST",
                          body: {
                            productId: d.productId || o.productId,
                            rating: Number(d.rating),
                            content: d.content,
                          },
                        });
                        setMessage("Review submitted for moderation.");
                      } catch (x) {
                        setError(x.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <h3>Share your experience</h3>
                    {o.items?.length > 1 && <label>
                      Product
                      <select name="productId" required>
                        {o.items.map(item => <option key={`${item.productId}-${item.variantId}`} value={item.productId}>{item.productName}</option>)}
                      </select>
                    </label>}
                    <label>
                      Rating
                      <select name="rating">
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Your review
                      <textarea name="content" required maxLength="3000" />
                    </label>
                    <button className="store-btn" disabled={busy}>
                      Submit review
                    </button>
                  </form>
                )}
                {o.paymentStatus === "paid" &&
                  !refunds.some(
                    (r) => r.orderId === o.id && r.status !== "rejected",
                  ) && (
                    <form
                      className="store-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        try {
                          const r = await api("/refunds", {
                            method: "POST",
                            body: {
                              orderId: o.id,
                              reason: new FormData(e.currentTarget).get(
                                "reason",
                              ),
                            },
                          });
                          setRefunds([...refunds, r]);
                          setMessage("Refund request submitted.");
                        } catch (x) {
                          setError(x.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <label>
                        Refund request reason
                        <textarea name="reason" required maxLength="2000" />
                      </label>
                      <button className="store-btn secondary" disabled={busy}>
                        Request a refund
                      </button>
                    </form>
                  )}
                {refunds
                  .filter((r) => r.orderId === o.id)
                  .map((r) => (
                    <p key={r.id}>
                      Refund: {r.status} · {r.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </article>
        )})
      ) : (
        <div className="store-empty">
          <Package size={32} />
          <h3>No orders just yet.</h3>
          <Link className="store-btn" to="/shop">
            Explore the collection
          </Link>
        </div>
      )}
    </Frame>
  );
}
export function JournalPage() {
  const { data, error } = useStore();
  const [category, setCategory] = useState("");
  const categories = data?.categories || [];
  const belongsTo = (post, id) => post.categoryId === id || post.categoryIds?.includes(id);
  const posts = (data?.posts || [])
    .filter(post => !category || belongsTo(post, category))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) ||
      (Date.parse(b.publishedAt || b.createdAt) || 0) - (Date.parse(a.publishedAt || a.createdAt) || 0));
  const [featured, ...remaining] = posts;
  const categoryName = post => categories.find(c => belongsTo(post, c.id))?.name || "The journal";
  const storyImage = (post, prominent = false) => (
    <div className="journal-image">
      {post.image ? <img src={imageUrl(post.image)} alt={post.title} loading={prominent ? "eager" : "lazy"} /> :
        <div className="journal-image-placeholder"><Leaf size={48} strokeWidth={1} /><span>Dr. Yogitha’s Journal</span></div>}
    </div>
  );
  const meta = post => (
    <div className="journal-meta"><span>{categoryName(post)}</span>{(post.publishedAt || post.createdAt) && <time dateTime={post.publishedAt || post.createdAt}>{date(post.publishedAt || post.createdAt)}</time>}</div>
  );
  return (
    <section className="store-journal">
      <header className="journal-heading">
        <div><p className="eyebrow">THE JOURNAL</p><h1>A little wisdom.<br /><em>A lasting ritual.</em></h1></div>
        <p>Discover thoughtful hair-care rituals, botanical ingredients and everyday moments of care.</p>
      </header>
      <div className="journal-filters" role="group" aria-label="Filter stories by category">
        {[{ id: "", name: "All stories" }, ...categories].map(c => (
          <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name}<span>{(data?.posts || []).filter(p => !c.id || belongsTo(p, c.id)).length}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Loading stories…</p>}
      {data && <div className="journal-results" aria-live="polite" aria-atomic="true">{posts.length} {posts.length === 1 ? "story" : "stories"}{category ? ` in ${categories.find(c => c.id === category)?.name || "this category"}` : " to explore"}</div>}
      {featured && <article className="journal-feature">
        <Link className="journal-feature-link" to={"/blog/" + featured.slug}>
          {storyImage(featured, true)}
          <div className="journal-feature-copy">
            <p className="journal-feature-label"><Leaf size={15} />{featured.featured ? "EDITOR’S PICK" : "LATEST STORY"}</p>
            {meta(featured)}
            <h2>{featured.title}</h2>
            <p className="journal-excerpt">{featured.excerpt}</p>
            {featured.author && <p className="journal-author">By {featured.author}</p>}
            <span className="journal-read">Read the story <ArrowRight size={18} /></span>
          </div>
        </Link>
      </article>}
      {remaining.length > 0 && <section className="journal-more" aria-labelledby="more-stories-title">
        <div className="journal-section-heading"><h2 id="more-stories-title">More from the journal</h2><span>Explore. Learn. Make it a ritual.</span></div>
        <div className="journal-story-grid">{remaining.map(post => (
          <article className="journal-story" key={post.id}><Link to={"/blog/" + post.slug}>
            {storyImage(post)}
            {meta(post)}
            <h3>{post.title}</h3>
            <p className="journal-excerpt">{post.excerpt}</p>
            <span className="journal-read">Read the story <ArrowRight size={16} /></span>
          </Link></article>
        ))}</div>
      </section>}
      {data && !posts.length && <div className="journal-empty"><Leaf size={32} /><h2>A new story is taking root.</h2><p>Check back soon for more from our journal.</p>{category && <button type="button" onClick={() => setCategory("")}>Explore all stories <ArrowRight size={16} /></button>}</div>}
    </section>
  );
}
export function ContentPage({ type }) {
  const { slug } = useParams(),
    { data, error } = useStore();
  const p = data?.[type].find((p) => p.slug === slug);
  if (!data)
    return (
      <Frame title="Loading…">
        <p>{error}</p>
      </Frame>
    );
  if (!p)
    return (
      <Frame title="This page is not available yet.">
        <Link to="/">Return home</Link>
      </Frame>
    );
  return (
    <Frame
      eyebrow={type === "posts" ? "THE JOURNAL" : "CUSTOMER INFORMATION"}
      title={p.title}
    >
      {p.author && (
        <p className="store-muted">
          By {p.author} · {date(p.updatedAt || p.createdAt)}
        </p>
      )}
      {p.image && <img className="article-image" src={imageUrl(p.image)} alt={p.title} />}
      {p.contentFormat === "html" ? <article className="article-body formatted-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.content) }} /> : <article className="article-body">{p.content}</article>}
      {p.tags?.length > 0 && <p className="article-tags">{p.tags.map(tag => <span key={tag}>{tag}</span>)}</p>}
      {type === "posts" && data.posts.some(post => p.relatedPostIds?.includes(post.id)) && <section className="product-faq"><h2>Related stories</h2>{data.posts.filter(post => p.relatedPostIds?.includes(post.id)).map(post => <p key={post.id}><Link to={`/blog/${post.slug}`}>{post.title}</Link></p>)}</section>}
    </Frame>
  );
}
export function ContactForm() {
  const { data } = useStore(),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const contact = {
    email: data?.settings.email || storeContact.email,
    phone: data?.settings.phone || storeContact.phone,
    address: data?.settings.address || storeContact.address,
  };
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`;
  return (
    <Frame
      eyebrow="LET’S START A CONVERSATION"
      title="We’d love to hear from you."
      className="premium-contact"
    >
      <div className="contact-grid">
        <div className="contact-details">
          <div className="contact-brand-mark"><Leaf size={28} strokeWidth={1.3} /><span>HERE TO HELP</span></div>
          <h2>A little guidance.<br />A personal touch.</h2>
          <p className="commerce-lead">
            A question about our collection or your order? Leave a note and
            we’ll get back to you.
          </p>
          <a className="contact-detail" href={`mailto:${contact.email}`}>
            <Mail aria-hidden="true" />
            <span><small>Email</small>{contact.email}</span>
          </a>
          <a className="contact-detail" href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>
            <Phone aria-hidden="true" />
            <span><small>Phone</small>{contact.phone}</span>
          </a>
          <div className="contact-detail">
            <MapPin aria-hidden="true" />
            <span><small>Address</small>{contact.address}</span>
          </div>
          <div className="contact-order-note"><Package size={19} /><p>Asking about an order? Include your order number so we can help you.</p></div>
        </div>
        <form
          className="store-form auth-card contact-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = e.currentTarget;
            setMessage("");
            try {
              await api("/leads", {
                method: "POST",
                body: Object.fromEntries(new FormData(form)),
              });
              setMessage(
                preview
                  ? "Sample enquiry saved in this browser."
                  : "Thank you. Your message has been received.",
              );
              form.reset();
            } catch (x) {
              setError(x.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="contact-form-heading"><h2>Send us a message</h2><p>Tell us what you have in mind.</p></div>
          <label>
            Name
            <input name="name" placeholder="Your full name" autoComplete="name" required maxLength="100" />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength="254" required />
          </label>
          <label>
            Phone
            <input
              name="phone"
              placeholder="10-digit mobile number"
              autoComplete="tel-national"
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength="10"
              required
            />
          </label>
          <label>
            Subject
            <input name="subject" placeholder="How can we help?" maxLength="150" required />
          </label>
          <label className="contact-message-field">
            Your message
            <textarea name="message" placeholder="Share your question or order details with us…" rows="3" maxLength="5000" required />
          </label>
          <div className="honeypot" aria-hidden="true">
            <input name="website" tabIndex="-1" autoComplete="off" />
          </div>
          {error && (
            <p className="store-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="store-success" role="status">
              {message}
            </p>
          )}
          <button className="store-btn" disabled={busy}>
            {busy ? "Sending…" : "Send your message"}
            <ArrowRight size={16} />
          </button>
          <p className="contact-privacy"><LockKeyhole size={14} aria-hidden="true" /> We respect your privacy. Your information is safe with us.</p>
        </form>
      </div>
      <section className="contact-map" aria-label="Our location">
        <div className="contact-map-heading"><div><p>FIND US</p><h2>Rooted in Bengaluru.</h2></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`} target="_blank" rel="noreferrer">Open in Maps <ArrowRight size={16} /></a></div>
        <iframe
          title={`Map showing ${contact.address}`}
          src={mapUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </section>
    </Frame>
  );
}
export function PolicyLinks() {
  const { data } = useStore();
  return (
    <div className="policy-links">
      {data?.policies.map((p) => (
        <Link key={p.id} to={"/policies/" + p.slug}>
          {p.title}
        </Link>
      ))}
      <Link to="/account">My account</Link>
    </div>
  );
}
