import { Link } from "react-router-dom";

export default function BlogPage() {
  return (
    <section className="info-page coming-soon-page">
      <div className="info-page-inner">
        <p className="eyebrow">THE JOURNAL</p>
        <h1>Stories for your hair-care ritual.</h1>
        <p className="info-page-lead">
          Notes on botanical hair care and Ayurvedic-inspired rituals are on
          their way. Check back soon.
        </p>
        <Link className="pill-button info-page-button" to="/">
          Return home <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
