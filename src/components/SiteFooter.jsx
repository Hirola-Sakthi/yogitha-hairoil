import { useStore } from "../commerce/StoreContext";
import { Link } from "react-router-dom";
import { Mail, Phone, MessageCircle, Truck, HeartHandshake } from "lucide-react";
import { FaInstagram, FaFacebookF, FaYoutube, FaLinkedinIn, FaMoneyBillWave } from "react-icons/fa6";
import { storeContact, policyNavigation } from "../shared/storeDefaults";
import "./site-footer.css";

export default function SiteFooter() {
  const { data } = useStore();
  const settings = data?.settings;
  const contact = { ...settings, email: settings?.email || storeContact.email, phone: settings?.phone || storeContact.phone, address: settings?.address || storeContact.address };
  const brand = contact?.brand || "Dr. Yogitha's";
  const policies = [...policyNavigation, ...(data?.policies || []).filter(p => !policyNavigation.some(link => link.slug === p.slug))];
  const product = data?.products.find(p => p.id === "hair-oil") || data?.products[0];
  const socials = [["Instagram", "instagramUrl", FaInstagram], ["Facebook", "facebookUrl", FaFacebookF], ["YouTube", "youtubeUrl", FaYoutube], ["LinkedIn", "linkedinUrl", FaLinkedinIn]];
  const whatsApp = contact?.whatsapp?.replace(/\D/g, "");
  return <footer className="store-footer">
    <div className="store-footer-main">
      <div className="store-footer-brand">
        <Link className="store-footer-wordmark" to="/">{brand}</Link>
        <p className="store-footer-tagline">NATURE, IN YOUR EVERYDAY RITUAL.</p>
        <p className="store-footer-description">{contact?.description || "Ayurvedic hair oil inspired by botanical traditions. A mindful ritual for your hair."}</p>
        <div className="store-footer-social"><h2>FOLLOW US</h2><div>
          {socials.map(([name, key, Icon]) => /^https:\/\//.test(contact[key] || "")
            ? <a key={key} href={contact[key]} target="_blank" rel="noopener noreferrer" aria-label={name}><Icon aria-hidden="true" /></a>
            : <span key={key} aria-label={`${name} profile not configured`} title={`${name} — profile link coming soon`}><Icon aria-hidden="true" /></span>)}
        </div></div>
      </div>
      <nav className="store-footer-column" aria-label="Shop links"><h2>SHOP</h2>
        {product && <Link to={`/products/${product.slug}`}>50 ml & 100 ml</Link>}
        <Link to="/#shop">Your hair ritual</Link>
        <Link to="/cart">Shopping bag</Link>
        <Link to="/blog">The journal</Link>
      </nav>
      <nav className="store-footer-column" aria-label="Company links"><h2>COMPANY</h2>
        <Link to="/about">Our story</Link><Link to="/contact">Contact us</Link>
        <Link to="/#formula">The ingredients</Link><Link to="/#craft">The making</Link>
      </nav>
      <nav className="store-footer-column" aria-label="Customer help"><h2>HELP</h2>
        <Link to="/account">My account</Link><Link to="/account">Track your order</Link>
        {product?.faq?.length > 0 && <Link to={`/products/${product.slug}#product-questions`}>Product questions</Link>}
        {policies.filter(p => ["shipping", "returns"].includes(p.slug)).map(p => <Link key={p.slug} to={`/policies/${p.slug}`}>{p.title}</Link>)}
        <Link to="/contact">Customer support</Link>
      </nav>
      <div className="store-footer-column store-footer-contact"><h2>CONTACT</h2>
        {contact?.email && <a href={`mailto:${contact.email}`}><Mail size={16} /><span>{contact.email}</span></a>}
        {contact?.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}><Phone size={16} /><span>{contact.phone}</span></a>}
        {whatsApp && <a href={`https://wa.me/${whatsApp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /><span>WhatsApp</span></a>}
        {contact?.address && <address>{contact.address}</address>}
      </div>
    </div>
    <div className="store-footer-service">
      <div><FaMoneyBillWave size={23} /><p><strong>PAYMENTS</strong><span>{[data?.checkout.cod && "Cash on delivery", data?.checkout.onlinePayments && "Secure online payments with Razorpay"].filter(Boolean).join(" · ") || "Contact us for payment information."}</span></p></div>
      <div><Truck size={23} /><p><strong>ORDER UPDATES</strong><span>Follow your order’s progress in your account.</span></p></div>
      <div><HeartHandshake size={23} /><p><strong>HERE TO HELP</strong><span>Questions about your ritual? Get in touch.</span></p></div>
    </div>
    <div className="store-footer-legal">
      <nav aria-label="Store policies">{policies.map(p => <Link key={p.slug} to={`/policies/${p.slug}`}>{p.title}</Link>)}</nav>
      <p className="footer-payment-label"><FaMoneyBillWave aria-hidden="true" /> {[data?.checkout.cod && "CASH ON DELIVERY", data?.checkout.onlinePayments && "RAZORPAY"].filter(Boolean).join(" · ") || "ONLINE PAYMENTS ARE NOT ENABLED"}</p>
    </div>
    <div className="store-footer-bottom"><p>© {new Date().getFullYear()} {brand}. All rights reserved.</p><Link to="/#top">Back to top ↑</Link></div>
  </footer>;
}
