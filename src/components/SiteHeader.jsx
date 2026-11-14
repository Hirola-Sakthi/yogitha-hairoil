import { Menu, UserRound, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

const prefetch = {
  "/about": () => import("../pages/AboutPage"),
  "/blog": () => import("../commerce/Pages"),
  "/contact": () => import("../commerce/Pages"),
  "/cart": () => import("../commerce/CartPage"),
  "/account": () => import("../commerce/Pages"),
};
const prefetchRoute = (path) => () => prefetch[path]?.();

export default function SiteHeader({ bagQuantity }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && setMenuOpen(false);
    document.body.classList.add("mobile-menu-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  return (
    <>
    <header className="site-header">
      <button className="mobile-menu-toggle" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(true)}>
        <Menu size={22} strokeWidth={1.6} />
      </button>
      <Link className="wordmark" to="/" aria-label="Dr. Yogitha's home">
        <img src="/main-logo.webp?v=3" alt="Dr. Yogitha's" width="200" height="21" fetchPriority="high" decoding="async" />
      </Link>
      <nav aria-label="Main navigation">
        <NavLink to="/about" onPointerEnter={prefetchRoute("/about")} onFocus={prefetchRoute("/about")}>About</NavLink>
        <NavLink to="/blog" onPointerEnter={prefetchRoute("/blog")} onFocus={prefetchRoute("/blog")}>Blog</NavLink>
        <NavLink to="/contact" onPointerEnter={prefetchRoute("/contact")} onFocus={prefetchRoute("/contact")}>Contact</NavLink>
      </nav>
      <Link
        className="bag-button"
        aria-label={`View shopping bag, ${bagQuantity} items`}
        to="/cart"
        onPointerEnter={prefetchRoute("/cart")}
        onFocus={prefetchRoute("/cart")}
      >
        <svg
          width="17"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M5 8h14l1 13H4L5 8Z" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </svg>
        <span aria-hidden="true">{bagQuantity}</span>
      </Link>
      <Link
        to="/account"
        onPointerEnter={prefetchRoute("/account")}
        onFocus={prefetchRoute("/account")}
        className="store-account-link"
        aria-label="My account"
      >
        <UserRound size={18} />
      </Link>
      <Link to="/#shop" className="nav-shop">
        Shop
      </Link>
    </header>
    <div className={`mobile-menu-backdrop${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen} inert={menuOpen ? undefined : ""} onClick={closeMenu}>
      <aside className="mobile-menu-panel" id="mobile-navigation" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-menu-top">
          <Link className="mobile-menu-logo" to="/" onClick={closeMenu} aria-label="Dr. Yogitha's home">
            <img src="/main-logo.webp?v=3" alt="Dr. Yogitha's" width="200" height="21" />
          </Link>
          <button className="mobile-menu-close" type="button" aria-label="Close menu" onClick={closeMenu}><X size={23} strokeWidth={1.6} /></button>
        </div>
        <nav className="mobile-menu-links" aria-label="Main menu">
          <div className="mobile-menu-primary">
            <Link to="/about" onClick={closeMenu}>About</Link>
            <Link to="/blog" onClick={closeMenu}>Blog</Link>
            <Link to="/contact" onClick={closeMenu}>Contact</Link>
          </div>
        </nav>
        <div className="mobile-menu-account">
          <Link to="/account" onClick={closeMenu}>My account</Link>
          <Link to="/cart" onClick={closeMenu}>Shopping bag <span>{bagQuantity}</span></Link>
        </div>
      </aside>
    </div>
    </>
  );
}
