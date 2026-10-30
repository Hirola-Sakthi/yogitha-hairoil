import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <section className="info-page coming-soon-page">
      <div className="info-page-inner">
        <p className="eyebrow">GET IN TOUCH</p>
        <h1>We'd love to hear from you.</h1>
        <p className="info-page-lead">
          Our contact details will be shared here soon. Until then, discover
          the botanical story behind Dr. Yogitha's Ayurvedic hair oil.
        </p>
        <Link className="pill-button info-page-button" to="/#formula">
          Explore the story <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
