import { useEffect, useRef } from "react";
import { useStore } from "./commerce/StoreContext";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import AboutPage from "./pages/AboutPage";

import HomePage from "./pages/HomePage";
import CartPage from "./commerce/CartPage";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";

import {
  AuthPage,
  CheckoutPage,
  AccountPage,
  JournalPage,
  ContentPage,
  ContactForm,
} from "./commerce/Pages";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const lenisRef = useRef(null);
  const location = useLocation();
  const { cart } = useStore();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (!target) return;
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, {
          duration: 1.1,
          onComplete: () => target.focus({ preventScroll: true }),
        });
      } else {
        target.scrollIntoView();
        target.focus({ preventScroll: true });
      }
      return;
    }

    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [location.key, location.pathname, location.hash]);

  const navigate = (event) => {
    const href = event.target.closest("a")?.getAttribute("href");
    if (
      !href?.startsWith("#") ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    const complete = () => {
      history.replaceState(history.state, "", href);
      target.focus({ preventScroll: true });
    };
    if (lenisRef.current)
      lenisRef.current.scrollTo(target, {
        duration: 1.1,
        onComplete: complete,
      });
    else {
      target.scrollIntoView();
      complete();
    }
  };


  return (
    <div onClick={navigate}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader bagQuantity={cart.count} />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<JournalPage />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/shop" element={<Navigate to="/#shop" replace />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/products/:slug"
            element={<Navigate to="/#shop" replace />}
          />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/reset-password" element={<AuthPage mode="reset" />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/blog/:slug" element={<ContentPage type="posts" />} />
          <Route
            path="/policies/:slug"
            element={<ContentPage type="policies" />}
          />
          <Route
            path="*"
            element={
              <section className="info-page coming-soon-page">
                <div className="info-page-inner">
                  <p className="eyebrow">PAGE NOT FOUND</p>
                  <h1>We couldn't find that page.</h1>
                  <p className="info-page-lead">
                    The page may have moved. Return home to explore Dr.
                    Yogitha's Ayurvedic hair oil.
                  </p>
                  <a className="pill-button info-page-button" href="/">
                    Return home <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </section>
            }
          />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}
