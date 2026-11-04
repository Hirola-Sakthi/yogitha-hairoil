import { Link } from "react-router-dom";
import { imageUrl } from "../shared/imageUrl";
import "../pages/home-assurances.css";

export default function RitualCta() {
  return (
    <section className="home-ritual-cta" aria-labelledby="ritual-cta-title">
      <div className="home-ritual-cta-copy">
        <p className="home-ritual-cta-eyebrow">DR. YOGITHA&apos;S AYURVEDIC HAIR OIL</p>
        <h2 id="ritual-cta-title">A little care.<br /><span>A lasting ritual.</span></h2>
        <p>Bring botanical inspiration and a mindful moment to your everyday hair care.</p>
        <Link to="/#shop" className="home-ritual-cta-button">Shop now <span aria-hidden="true">&rarr;</span></Link>
      </div>
      <div className="home-ritual-cta-image">
        <img src={imageUrl(`${import.meta.env.BASE_URL}cta-img.webp`)} alt="Woman with long hair beside an Ayurvedic hair oil bottle" loading="lazy" />
      </div>
    </section>
  );
}
