import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useStore } from "./StoreContext";
import "./customer-reviews.css";

export default function CustomerReviews() {
  const { data } = useStore();
  const reviews = (data?.reviews || [])
    .filter((review) => review.rating > 0 && review.content?.trim())
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((index) => reviews.length ? index % reviews.length : 0);
  }, [reviews.length]);

  useEffect(() => {
    if (reviews.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % reviews.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reviews.length]);

  const move = (direction) => {
    setActiveIndex((index) => (index + direction + reviews.length) % reviews.length);
  };
  const visibleReviews = reviews.map((item, index) => {
    let offset = index - activeIndex;
    if (offset > reviews.length / 2) offset -= reviews.length;
    if (offset < -reviews.length / 2) offset += reviews.length;
    return { item, index, offset };
  }).filter(({ offset }) => Math.abs(offset) <= 2);
  const visibleOffsets = new Set(visibleReviews.map(({ offset }) => offset));
  const emptyOffsets = [-2, -1, 1, 2].filter((offset) => !visibleOffsets.has(offset));

  return (
    <section className="customer-reviews" aria-label="Customer reviews">
      <div className="customer-reviews-inner">
        <p className="eyebrow">CUSTOMER LOVE</p>
        <h2>What Our Customers Are Saying</h2>
        <p className="customer-reviews-intro">Thoughtful words from people who have made our Ayurvedic hair oil part of their routine.</p>
        <div className="review-carousel" aria-live="polite" aria-atomic="true">
          {reviews.length ? visibleReviews.map(({ item, index, offset }) => (
            <article
              className={`home-review-card${offset === 0 ? " is-active" : ""} review-offset-${offset}`}
              key={item.id || index}
              aria-hidden={offset !== 0}
            >
              <div className="review-card-topline"><span className="review-verified-mark">✓</span> {item.source === "manual" ? "CUSTOMER REVIEW" : "VERIFIED CUSTOMER REVIEW"}</div>
              <div className="home-review-stars" aria-label={`${item.rating} out of 5 stars`}>
                {Array.from({ length: Math.min(5, Math.max(0, Number(item.rating))) }, (_, starIndex) => <Star key={starIndex} size={15} fill="currentColor" aria-hidden="true" />)}
              </div>
              <blockquote>“{item.content}”</blockquote>
              <div className="review-card-footer">
                <p className="home-review-author">{item.name}</p>
                {item.location && <p className="home-review-caption">{item.location}</p>}
              </div>
            </article>
          )) : (
            <article className="home-review-card home-review-empty is-active">
              <div className="review-card-topline"><span className="review-verified-mark">✓</span> CUSTOMER REVIEW</div>
              <div className="home-review-stars" aria-hidden="true"><Star size={15} /></div>
              <blockquote>We look forward to hearing about your hair-care ritual.</blockquote>
              <div className="review-card-footer"><p className="home-review-caption">Customer reviews coming soon</p></div>
            </article>
          )}
          {emptyOffsets.map((offset) => (
            <div className={`home-review-card review-ghost-card review-offset-${offset}`} key={`review-ghost-${offset}`} aria-hidden="true">
              <div className="review-ghost-topline"><span /><i /></div>
              <div className="review-ghost-stars" />
              <div className="review-ghost-copy"><i /><i /><i /><i /><i /></div>
              <div className="review-ghost-footer"><i /><i /></div>
            </div>
          ))}
          <button className="review-arrow review-arrow-left" type="button" aria-label="Previous review" onClick={() => move(-1)} disabled={reviews.length < 2}><ArrowLeft size={18} /></button>
          <button className="review-arrow review-arrow-right" type="button" aria-label="Next review" onClick={() => move(1)} disabled={reviews.length < 2}><ArrowRight size={18} /></button>
        </div>
        <div className="review-pagination" aria-label={reviews.length > 1 ? "Choose a review" : "Review carousel position"}>
          {reviews.length > 1
            ? reviews.map((item, index) => <button key={item.id || index} type="button" className={index === activeIndex ? "active" : ""} aria-label={`Show review ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => setActiveIndex(index)} />)
            : Array.from({ length: 5 }, (_, index) => <span key={index} className={index === (reviews.length ? 0 : 2) ? "active" : ""} aria-hidden="true" />)}
        </div>
      </div>
    </section>
  );
}
