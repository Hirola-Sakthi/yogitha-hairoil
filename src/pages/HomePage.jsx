import {
  Droplets,
  Flower2,
  HandHeart,
  Leaf,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { imageUrl } from "../shared/imageUrl";
import "./home-assurances.css";

const ProductCollection = lazy(() => import("../commerce/ProductCards"));
const ManufacturingRegistry = lazy(
  () => import("../commerce/ManufacturingRegistry"),
);
const OilBlendStory = lazy(() => import("../commerce/OilBlendStory"));
const HomeRitualGuide = lazy(() => import("../commerce/HomeRitualGuide"));
const ProductSequence = lazy(() => import("../ProductSequence"));
const IngredientStoryCards = lazy(
  () => import("../commerce/IngredientStoryCards"),
);
const CustomerReviews = lazy(() => import("../commerce/CustomerReviews"));
const RecentBlogs = lazy(() => import("../commerce/RecentBlogs"));
const RitualCta = lazy(() => import("../commerce/RitualCta"));
const HomeFaq = lazy(() => import("../commerce/HomeFaq"));

function DeferredSection({ children, minHeight = 240, id, force = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(force);
  useEffect(() => {
    if (force) {
      setVisible(true);
      return undefined;
    }
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div id={id} ref={ref} style={visible ? undefined : { minHeight }}>
      <Suspense fallback={null}>{visible ? children : null}</Suspense>
    </div>
  );
}

function HeroFallback() {
  return (
    <section className="sequence" aria-label="The Ayurvedic hair oil story">
      <div className="film-stage">
        <picture>
          <source
            media="(max-width: 600px)"
            srcSet={`${import.meta.env.BASE_URL}scenes/herbal-oil-advertisement-2-mobile/poster.webp?v=hair-oil-ad-2-mobile-768w-webp-q60-v1`}
          />
          <img
            className="film-poster"
            src={`${import.meta.env.BASE_URL}scenes/herbal-oil-advertisement-2/poster.webp?v=hair-oil-ad-2-4k-skip4-webp-q95-v2`}
            alt="Dr. Yogitha's Ayurvedic hair oil advertisement"
            width="3840"
            height="2160"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
    </section>
  );
}

export default function HomePage() {
  const location = useLocation();
  const [sequenceActive, setSequenceActive] = useState(
    () => !matchMedia("(max-width: 600px)").matches,
  );
  const shouldScrollToShop = location.state?.scrollTo === "shop";
  useEffect(() => {
    if (!shouldScrollToShop) return undefined;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document
          .getElementById("shop")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [shouldScrollToShop]);
  useEffect(() => {
    if (!matchMedia("(max-width: 600px)").matches) return undefined;
    const activate = () => setSequenceActive(true);
    // Keep the visual frame-scroll feature, but defer its JavaScript and canvas
    // work until the visitor starts interacting with the mobile page.
    window.addEventListener("touchstart", activate, {
      once: true,
      passive: true,
    });
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
      {sequenceActive ? (
        <Suspense fallback={<HeroFallback />}>
          <ProductSequence />
        </Suspense>
      ) : (
        <HeroFallback />
      )}
      <section className="shop-section shop-hero">
        <img
          className="shop-leaves shop-leaves-left"
          src={imageUrl(
            `${import.meta.env.BASE_URL}botanical-corner-foliage.png`,
          )}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <img
          className="shop-leaves shop-leaves-right"
          src={imageUrl(
            `${import.meta.env.BASE_URL}botanical-corner-foliage.png`,
          )}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <div className="shop-image shop-product-art">
          <img
            src={imageUrl(
              `${import.meta.env.BASE_URL}ayurvedic-hair-oil-display.webp`,
            )}
            alt="Dr. Yogitha's Ayurvedic hair oil bottle surrounded by green leaves, botanicals, and a red flower"
            width="1074"
            height="1024"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="shop-copy">
          <div className="shop-hero-eyebrow">
            <p className="eyebrow">THE COLLECTION</p>
          </div>
          <h2>
            Intensive
            <br />
            Hair Ampoule
          </h2>
          <p className="shop-description">
            Every drop is crafted with deep respect for the science of Ayurveda,
            following the classical Taila Paka method.
          </p>
          <div className="product-highlights" aria-label="Product highlights">
            <div>
              <span>
                <Leaf aria-hidden="true" />
              </span>
              <p>Every ingredient has a purpose</p>
            </div>
            <div>
              <span>
                <Flower2 aria-hidden="true" />
              </span>
              <p>Classical Taila Paka</p>
            </div>
            <div>
              <span>
                <Droplets aria-hidden="true" />
              </span>
              <p>Monitored temperature</p>
            </div>
            <div>
              <span>
                <HandHeart aria-hidden="true" />
              </span>
              <p>Prakruthi-based formulation</p>
            </div>
          </div>
          <Link className="shop-discover" to="/about">
            Discover More <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>
      <DeferredSection id="shop" minHeight={760} force={shouldScrollToShop}>
        <ProductCollection />
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <OilBlendStory />
      </DeferredSection>
      <DeferredSection minHeight={860}>
        <HomeRitualGuide />
      </DeferredSection>
      <DeferredSection minHeight={520}>
        <ManufacturingRegistry />
      </DeferredSection>
      <DeferredSection minHeight={760}>
        <IngredientStoryCards />
      </DeferredSection>
      <DeferredSection minHeight={400}>
        <CustomerReviews />
      </DeferredSection>
      <section
        className="home-assurances"
        aria-label="Shopping with confidence"
      >
        <article className="home-assurance">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2>Secure Payments</h2>
            <p>Pay securely with cards, UPI and other supported methods.</p>
          </div>
        </article>
        <article className="home-assurance">
          <Truck aria-hidden="true" />
          <div>
            <h2>Delivery to Your Door</h2>
            <p>See delivery availability and shipping charges at checkout.</p>
          </div>
        </article>
        <article className="home-assurance">
          <MessageCircle aria-hidden="true" />
          <div>
            <h2>Here to Help</h2>
            <p>Questions about your order? We&apos;re ready to help.</p>
          </div>
        </article>
        <article className="home-assurance">
          <Leaf aria-hidden="true" />
          <div>
            <h2>Rooted in Classical Ayurveda</h2>
            <p>An Ayurvedic Taila Paka prepared according to classical principles.</p>
          </div>
        </article>
      </section>
      <DeferredSection minHeight={300}>
        <RecentBlogs />
      </DeferredSection>
      <DeferredSection minHeight={360}>
        <RitualCta />
      </DeferredSection>
      <DeferredSection minHeight={500}>
        <HomeFaq />
      </DeferredSection>
    </>
  );
}
