import { Droplets, Flower2, HandHeart, Leaf, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import ProductSequence from "../ProductSequence";
import ProductCollection from "../commerce/ProductCards";
import RecentBlogs from "../commerce/RecentBlogs";
import CustomerReviews from "../commerce/CustomerReviews";
import IngredientStoryCards from "../commerce/IngredientStoryCards";
import HomeFaq from "../commerce/HomeFaq";
import RitualCta from "../commerce/RitualCta";
import { imageUrl } from "../shared/imageUrl";
import "./home-assurances.css";

export default function HomePage() {
  return (
    <>
      <ProductSequence />
      <section className="shop-section shop-hero">
        <img className="shop-leaves shop-leaves-left" src={imageUrl(`${import.meta.env.BASE_URL}botanical-corner-foliage.png`)} alt="" aria-hidden="true" />
        <img className="shop-leaves shop-leaves-right" src={imageUrl(`${import.meta.env.BASE_URL}botanical-corner-foliage.png`)} alt="" aria-hidden="true" />
        <div className="shop-image shop-product-art">
          <img
            src={imageUrl(`${import.meta.env.BASE_URL}ayurvedic-hair-oil-display.webp`)}
            alt="Dr. Yogitha's Ayurvedic hair oil bottle surrounded by green leaves, botanicals, and a red flower"
            width="1074"
            height="1024"
            loading="lazy"
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
      <ProductCollection />
      <IngredientStoryCards />
      <CustomerReviews />
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
      <RecentBlogs />
      <RitualCta />
      <HomeFaq />
    </>
  );
}
