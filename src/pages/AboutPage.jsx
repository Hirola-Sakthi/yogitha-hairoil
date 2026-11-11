import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, FlaskConicalOff, Leaf, Recycle, X } from "lucide-react";
import HomeFaq from "../commerce/HomeFaq";
import HomeSocialGallery from "../commerce/HomeSocialGallery";
import AboutIngredientStory from "../commerce/AboutIngredientStory";

const aboutReels = [
  { video: "/reels/reels-1.mp4", title: "Hair-care reel 1" },
  { video: "/reels/reels-2.mp4", title: "Hair-care reel 2" },
  { video: "/reels/reels-1.mp4", title: "Hair-care reel 3" },
  { video: "/reels/reels-2.mp4", title: "Hair-care reel 4" },
];
const aboutStandards = [
  { title: "100% Natural Botanical", Icon: Leaf },
  { title: "Chemical Free", Icon: FlaskConicalOff },
  { title: "Dermatologically Tested", Icon: BadgeCheck },
  { title: "Recyclable Packaging", Icon: Recycle },
];

export default function AboutPage() {
  const [activeReel, setActiveReel] = useState(-1);
  useEffect(() => {
    if (activeReel < 0) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveReel(-1);
      if (event.key === "ArrowRight") setActiveReel((index) => (index + 1) % aboutReels.length);
      if (event.key === "ArrowLeft") setActiveReel((index) => (index - 1 + aboutReels.length) % aboutReels.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeReel]);
  return (
    <>
    <section className="info-page about-page">
      <div className="info-page-inner">
        <div className="about-intro">
          <div className="about-copy">
            <p className="eyebrow">ABOUT US</p>
            <h1>A more mindful way to care for your hair.</h1>
            <p className="info-page-lead">
              Inspired by Ayurvedic traditions and the beauty of botanicals, our
              hair oil makes room for a little more care in your everyday routine.
            </p>
            <div className="about-actions">
              <Link className="about-buy-button" to="/#shop">Buy Now</Link>
              <a className="about-details-button" href="#about-details">View Details</a>
            </div>
          </div>
          <div className="about-image-wrap">
            <img src="/about-main-img.webp" alt="Dr. Yogitha's Ayurvedic hair oil with botanical ingredients" />
          </div>
        </div>
      </div>
    </section>
    <section className="about-marquee" aria-label="Ayurvedic hair care, botanical oils, mindful rituals, rooted in tradition, made with care">
      <div className="about-marquee-track" aria-hidden="true">
        {[0, 1].map((loop) => <div className="about-marquee-group" key={loop}>
          {["Ayurvedic Hair Care", "Botanical Oils", "Mindful Rituals", "Rooted in Tradition", "Made with Care"].map((item) => (
            <span className="about-marquee-item" key={item}>{item}<i>&#10022;</i></span>
          ))}
        </div>)}
      </div>
    </section>
    <section className="info-page about-page about-page-body">
      <div className="info-page-inner">
        <section className="about-journey" aria-labelledby="about-journey-title">
          <div className="about-journey-collage" aria-label="Moments from a mindful hair-care ritual">
            <div className="about-journey-image about-journey-image-main"><img src="/routine-1.webp" alt="Long, healthy-looking hair in a botanical setting" loading="lazy" /></div>
            <div className="about-journey-image about-journey-image-top"><img src="/routine-2.webp" alt="Pouring hair oil into the palm of a hand" loading="lazy" /></div>
            <div className="about-journey-image about-journey-image-bottom"><img src="/routine-3.webp" alt="Applying oil along the scalp" loading="lazy" /></div>
            <div className="about-journey-image about-journey-image-side"><img src="/routine-4.webp" alt="Massaging oil into the scalp as part of a hair-care ritual" loading="lazy" /></div>
            <span className="about-journey-seal" aria-hidden="true"><span>DR. YOGITHA&apos;S</span><i>&#10022;</i><span>ROOTED IN CARE</span></span>
          </div>
          <div className="about-journey-copy">
            <p className="eyebrow">OUR APPROACH</p>
            <h2 id="about-journey-title">Your journey to <span>mindful hair care.</span></h2>
            <p>Inspired by Ayurvedic tradition, Dr. Yogitha&apos;s Hair Oil brings botanical care and a little more intention to your everyday ritual.</p>
            <div className="about-journey-pillars" aria-label="What guides our approach">
              <div><strong>Ayurvedic</strong><span>tradition</span></div>
              <div><strong>Botanical</strong><span>inspiration</span></div>
              <div><strong>Everyday</strong><span>rituals</span></div>
            </div>
            <Link className="about-journey-link" to="/#shop">Explore the hair oil <span aria-hidden="true">&rarr;</span></Link>
          </div>
        </section>
        <div className="about-doctor" id="about-details">
          <div className="about-doctor-image">
            <img src="/dr-yogitha.jpg" alt="Dr. Yogitha" loading="lazy" />
            <span className="about-doctor-image-caption">DR. YOGITHA&apos;S &middot; PERSONAL CARE, ROOTED IN TRADITION</span>
          </div>
          <div className="about-doctor-copy">
            <Leaf className="about-doctor-emblem" aria-hidden="true" />
            <p className="eyebrow">A NOTE FROM THE FOUNDER</p>
            <h2>Meet Dr. Yogitha.</h2>
            <p className="about-doctor-lead">A thoughtful approach to hair care, inspired by the wisdom of Ayurveda.</p>
            <span className="about-doctor-rule" aria-hidden="true" />
            <p className="about-doctor-body">
              Dr. Yogitha's Hair Oil was created to bring a little more intention
              to your everyday routine. Inspired by botanical traditions, it is
              an invitation to slow down, care for your hair, and make the ritual
              your own.
            </p>
            <Link className="about-doctor-link" to="/#shop">Discover the hair oil <span aria-hidden="true">&rarr;</span></Link>
          </div>
        </div>
        <section className="about-purpose" aria-labelledby="about-purpose-title">
          <header className="about-purpose-heading">
            <p className="eyebrow">WHAT GUIDES US</p>
            <h2 id="about-purpose-title">Care with intention.</h2>
            <span className="about-purpose-rule" aria-hidden="true"><i>&#10022;</i></span>
          </header>
          <div className="about-purpose-grid">
            <article className="about-purpose-panel about-purpose-vision">
              <p className="eyebrow">OUR VISION</p>
              <h3>Make everyday hair care feel like a moment of care.</h3>
              <p>We imagine a more mindful routine, inspired by the wisdom of Ayurveda and a lasting connection to nature.</p>
              <span className="about-purpose-leaf" aria-hidden="true"><Leaf size={230} strokeWidth={1} /></span>
            </article>
            <article className="about-purpose-panel about-purpose-mission">
              <p className="eyebrow">OUR MISSION</p>
              <h3>Bring botanical tradition into a simple daily ritual.</h3>
              <p>We create thoughtful hair care that invites you to slow down, care for your hair, and make the ritual your own.</p>
              <span className="about-purpose-signoff">DR. YOGITHA&apos;S <i>·</i> ROOTED IN TRADITION</span>
            </article>
          </div>
        </section>
        <section className="about-explore" aria-labelledby="about-explore-title">
          <header className="about-explore-heading">
            <p className="eyebrow">A RITUAL, ROOTED IN CARE</p>
            <h2 id="about-explore-title">Explore &amp; Shop</h2>
            <span aria-hidden="true" />
          </header>
          <div className="about-explore-grid">
            {aboutReels.map((reel, index) => (
              <button className="about-explore-card" type="button" onClick={() => setActiveReel(index)} key={`${reel.video}-${index}`} aria-label={`Play video: ${reel.title}`}>
                <video src={reel.video} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

      </div>
    </section>

    <div className="about-standards-wrap">
        <section className="about-standards" aria-labelledby="about-standards-title">
          <h2 id="about-standards-title"><Leaf size={20} aria-hidden="true" />Indulge In The Goodness Of Non-Toxic Beauty</h2>
          <div className="about-standards-grid">
            {aboutStandards.map(({ title, Icon }) => (
              <div className="about-standard" key={title}>
                <span className="about-standard-icon"><Icon size={43} strokeWidth={1.7} aria-hidden="true" /></span>
                <strong>{title}</strong>
              </div>
            ))}
          </div>
        </section>
    </div>
    <AboutIngredientStory />
    <HomeSocialGallery />
    <section className="about-ritual-cta" aria-labelledby="about-ritual-cta-title">
      <div className="about-ritual-cta-copy">
        <p className="eyebrow">A MORE MINDFUL RITUAL</p>
        <h2 id="about-ritual-cta-title">A little care, made part of every day.</h2>
        <p>Discover a thoughtful hair-care ritual inspired by Ayurvedic tradition and botanical ingredients.</p>
        <Link className="about-ritual-cta-button" to="/#shop">Explore the hair oil <span aria-hidden="true">&rarr;</span></Link>
      </div>
      <div className="about-ritual-cta-art" aria-hidden="true">
        <img src="/about-cta.webp" alt="" loading="lazy" />
      </div>
      <span className="about-ritual-cta-note" aria-hidden="true">DR. YOGITHA&apos;S <i>&middot;</i> ROOTED IN CARE</span>
    </section>
    {activeReel >= 0 && (
      <div className="about-reel-backdrop" role="dialog" aria-modal="true" aria-label={aboutReels[activeReel].title} onClick={(event) => { if (event.target === event.currentTarget) setActiveReel(-1); }}>
        <button className="about-reel-close" type="button" onClick={() => setActiveReel(-1)} aria-label="Close video"><X size={21} /></button>
        <button className="about-reel-nav about-reel-prev" type="button" onClick={() => setActiveReel((activeReel - 1 + aboutReels.length) % aboutReels.length)} aria-label="Previous video"><ChevronLeft size={32} /></button>
        <article className="about-reel-modal" onClick={(event) => event.stopPropagation()}>
          <video key={aboutReels[activeReel].video} src={aboutReels[activeReel].video} controls autoPlay muted playsInline />
        </article>
        <button className="about-reel-nav about-reel-next" type="button" onClick={() => setActiveReel((activeReel + 1) % aboutReels.length)} aria-label="Next video"><ChevronRight size={32} /></button>
      </div>
    )}
    <HomeFaq variant="about" />
    </>
  );
}
