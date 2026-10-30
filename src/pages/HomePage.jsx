import { Droplets, Flower2, HandHeart, Leaf } from "lucide-react";
import ProductSequence from "../ProductSequence";
import ProductCollection from "../commerce/ProductCards";
import RecentBlogs from "../commerce/RecentBlogs";
import { imageUrl } from "../shared/imageUrl";

export default function HomePage() {
  return (
    <>
      <ProductSequence />
      <section className="shop-section">
        <div className="shop-image">
          <img
            src={imageUrl(`${import.meta.env.BASE_URL}product-showcase.webp`)}
            alt="Dr. Yogitha's Ayurvedic hair oil bottle surrounded by green leaves, botanicals, and a red flower"
            width="819"
            height="768"
            loading="lazy"
          />
        </div>
        <div className="shop-copy">
          <p className="eyebrow">THE COLLECTION</p>
          <h2>
            Ayurvedic <span>Hair Oil</span>
          </h2>
          <p className="shop-description">
            A golden botanical hair oil inspired by Ayurvedic traditions.
            Created with a thoughtful appreciation for plant-based care, it
            brings a touch of nature to your hair-care routine. Its golden
            texture makes each application feel considered.
          </p>
          <p className="shop-description shop-description-secondary">
            Bring a little intention to your routine and make a mindful moment
            for your hair. Take time to slow down and enjoy a simple act of
            care. Make the ritual your own, whenever it fits your day.
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
        </div>
      </section>
      <ProductCollection />
      <RecentBlogs />
      <section id="routine" className="routine" tabIndex={-1}>
        <div className="routine-heading">
          <p className="eyebrow">DR. YOGITHA'S AYURVEDIC HAIR OIL</p>
          <h2>A ritual rooted in care.</h2>
        </div>
        <div className="routine-grid">
          <article>
            <span>01</span>
            <h3>Botanical by tradition</h3>
            <p>Hair oil inspired by Ayurvedic botanical care.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Golden oil, considered care</h3>
            <p>A simple way to make time for your hair.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Your hair ritual</h3>
            <p>Bring a little intention to your hair-care routine.</p>
          </article>
        </div>
      </section>
    </>
  );
}
