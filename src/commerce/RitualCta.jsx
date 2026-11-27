import { Link } from "react-router-dom";
import "../pages/home-assurances.css";

export default function RitualCta() {
  return (
    <section className="home-ritual-cta" aria-labelledby="ritual-cta-title">
      <div className="home-ritual-cta-copy">
        <h2 id="ritual-cta-title">Be gentle.<br /><span>Your hair deserves care.</span></h2>
        <p>Make four minutes of gentle scalp massage part of your daily hair-care routine. Use your fingertips and keep the pressure light.</p>
        <Link to="/#shop" className="home-ritual-cta-button">Shop now <span aria-hidden="true">&rarr;</span></Link>
      </div>
      <div className="home-ritual-cta-image">
        <img src={`${import.meta.env.BASE_URL}cta-img.webp`} alt="Woman with long hair beside an Ayurvedic hair oil bottle" loading="lazy" />
      </div>
    </section>
  );
}
