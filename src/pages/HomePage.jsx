import { Droplets, Flower2, HandHeart, Leaf, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../shared/imageUrl";
import "./home-assurances.css";

const ProductCollection = lazy(() => import("../commerce/ProductCards"));
const ProductSequence = lazy(() => import("../ProductSequence"));
const IngredientStoryCards = lazy(() => import("../commerce/IngredientStoryCards"));
const CustomerReviews = lazy(() => import("../commerce/CustomerReviews"));
const RecentBlogs = lazy(() => import("../commerce/RecentBlogs"));
const RitualCta = lazy(() => import("../commerce/RitualCta"));
const HomeFaq = lazy(() => import("../commerce/HomeFaq"));

function DeferredSection({ children, minHeight = 240 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "700px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={visible ? undefined : { minHeight }}><Suspense fallback={null}>{visible ? children : null}</Suspense></div>;
}

function HeroFallback() {
  return <section className="sequence" aria-label="The Ayurvedic hair oil story">
    <div className="film-stage">
      <picture>
        <source media="(max-width: 600px)" srcSet={`${import.meta.env.BASE_URL}scenes/herbal-oil-advertisement-2-mobile/poster.webp?v=hair-oil-ad-2-mobile-768w-webp-q60-v1`} />
        <img className="film-poster" src={`${import.meta.env.BASE_URL}scenes/herbal-oil-advertisement-2/poster.webp?v=hair-oil-ad-2-4k-skip4-webp-q95-v2`} alt="Dr. Yogitha's Ayurvedic hair oil advertisement" width="3840" height="2160" fetchPriority="high" decoding="async" />
      </picture>
    </div>
  </section>;
}

export default function HomePage() {
  const [sequenceActive, setSequenceActive] = useState(() => !matchMedia("(max-width: 600px)").matches);
  useEffect(() => {
    if (!matchMedia("(max-width: 600px)").matches) return undefined;
    const activate = () => setSequenceActive(true);
    // Keep the visual frame-scroll feature, but defer its JavaScript and canvas
    // work until the visitor starts interacting with the mobile page.
    window.addEventListener("touchstart", activate, { once: true, passive: true });
    window.addEventListener("wheel", activate, { once: true, passive: true });
    window.addEventListener("keydown", activate, { once: true });
    return () => {
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("wheel", activate);
      window.removeEventListener("keydown", activate);
    };
  }, []);
  return (
    <>
      {sequenceActive ? <Suspense fallback={<HeroFallback />}><ProductSequence /></Suspense> : <HeroFallback />}
      <section className="shop-section shop-hero">
        <img className="shop-leaves shop-leaves-left" src={imageUrl(`${import.meta.env.BASE_URL}botanical-corner-foliage.png`)} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <img className="shop-leaves shop-leaves-right" src={imageUrl(`${import.meta.env.BASE_URL}botanical-corner-foliage.png`)} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <div className="shop-image shop-product-art">
          <img
            src={imageUrl(`${import.meta.env.BASE_URL}ayurvedic-hair-oil-display.webp`)}
            alt="Dr. Yogitha's Ayurvedic hair oil bottle surrounded by green leaves, botanicals, and a red flower"
            width="1074"
            height="1024"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="shop-copy">
          <div className="shop-hero-eyebrow"><Leaf aria-hidden="true" /><p className="eyebrow">THE COLLECTION</p></div>
          <h2>
            Ayurvedic<br /><span>Hair Oil</span>
          </h2>
          <p className="shop-hero-tagline">NATURE&apos;S CARE FOR STRONGER, HEALTHIER HAIR</p>
          <span className="shop-hero-rule" aria-hidden="true" />
          <p className="shop-description">
            A golden blend of ancient Ayurveda and modern care, crafted to
            nourish your hair from root to tip.
          </p>
          <div className="product-highlights" aria-label="Product highlights">
            <div>
              <span><Leaf aria-hidden="true" /></span>
              <p>Botanical<br />inspiration</p>
            </div>
            <div>
              <span><Flower2 aria-hidden="true" /></span>
              <p>Ayurvedic<br />tradition</p>
            </div>
            <div>
              <span><Droplets aria-hidden="true" /></span>
              <p>Golden oil<br />texture</p>
            </div>
            <div>
              <span><HandHeart aria-hidden="true" /></span>
              <p>A mindful<br />hair ritual</p>
            </div>
          </div>
          <Link className="shop-discover" to="/about">Discover More <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </section>
      <DeferredSection minHeight={760}><ProductCollection /></DeferredSection>
      <DeferredSection minHeight={500}><IngredientStoryCards /></DeferredSection>
      <DeferredSection minHeight={400}><CustomerReviews /></DeferredSection>
      <section className="home-assurances" aria-label="Shopping with confidence">
        <article className="home-assurance">
          <ShieldCheck aria-hidden="true" />
          <div><h2>Secure Payments</h2><p>Pay securely with cards, UPI and other supported methods.</p></div>
        </article>
        <article className="home-assurance">
          <Truck aria-hidden="true" />
          <div><h2>Delivery to Your Door</h2><p>See delivery availability and shipping charges at checkout.</p></div>
        </article>
        <article className="home-assurance">
          <MessageCircle aria-hidden="true" />
          <div><h2>Here to Help</h2><p>Questions about your order? We&apos;re ready to help.</p></div>
        </article>
        <article className="home-assurance">
          <Leaf aria-hidden="true" />
          <div><h2>Botanical Inspiration</h2><p>An everyday hair oil inspired by Ayurvedic tradition.</p></div>
        </article>
      </section>
      <DeferredSection minHeight={300}><RecentBlogs /></DeferredSection>
      <DeferredSection minHeight={360}><RitualCta /></DeferredSection>
      <DeferredSection minHeight={500}><HomeFaq /></DeferredSection>
    </>
  );
}
