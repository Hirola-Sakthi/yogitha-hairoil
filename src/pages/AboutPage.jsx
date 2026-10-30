import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <section className="info-page about-page">
      <div className="info-page-inner">
        <p className="eyebrow">ABOUT DR. YOGITHA'S</p>
        <h1>A more mindful way to care for your hair.</h1>
        <p className="info-page-lead">
          Inspired by Ayurvedic traditions and the beauty of botanicals, our
          hair oil makes room for a little more care in your everyday routine.
        </p>
        <div className="info-page-details">
          <article>
            <span>01 / OUR INSPIRATION</span>
            <h2>Rooted in botanical tradition.</h2>
            <p>
              We look to Ayurvedic traditions for inspiration, bringing a
              botanical point of view to a simple hair-care ritual.
            </p>
          </article>
          <article>
            <span>02 / OUR APPROACH</span>
            <h2>Care at your own pace.</h2>
            <p>
              A golden hair oil, a moment to slow down, and a ritual that makes
              a little time for yourself.
            </p>
          </article>
        </div>
        <Link className="pill-button info-page-button" to="/#shop">
          Discover the oil <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
