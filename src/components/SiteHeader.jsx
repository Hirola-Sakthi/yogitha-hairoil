import { UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

export default function SiteHeader({ bagQuantity }) {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Dr. Yogitha's home">
        Dr. Yogitha's
      </Link>
      <nav aria-label="Main navigation">
        <NavLink to="/about">About</NavLink>
        <NavLink to="/blog">Blog</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </nav>
      <Link
        className="bag-button"
        aria-label={`View shopping bag, ${bagQuantity} items`}
        to="/cart"
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
        className="store-account-link"
        aria-label="My account"
      >
        <UserRound size={18} />
      </Link>
      <Link to="/#shop" className="nav-shop">
        Shop
      </Link>
    </header>
  );
}
