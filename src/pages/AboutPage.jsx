import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Brush,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Fingerprint,
  Hand,
  Leaf,
  MoonStar,
  Scale,
  ScanFace,
  Wind,
  X,
} from "lucide-react";
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
  { title: "Classical Taila Paka", Icon: Droplets },
  { title: "Rasapanchaka-guided selection", Icon: Scale },
  { title: "Scalp types considered", Icon: ScanFace },
  { title: "Individual Prakruthi considered", Icon: Fingerprint },
];
const ritualSteps = [
  {
    title: "Massage gently",
    text: "Use your fingertips to gently massage your scalp.",
    Icon: Hand,
  },
  {
    title: "Go easy on styling",
    text: "	Avoid excessive heat and tight hairstyles.",
    Icon: Brush,
  },
  {
    title: "Pat dry with care",
    text: "Use a soft cotton towel and avoid harsh rubbing or pulling.",
    Icon: Wind,
  },
  {
    title: "Make time for rest",
    text: "Get enough sleep and take time to manage stress.",
    Icon: MoonStar,
  },
];

export default function AboutPage() {
  const [activeReel, setActiveReel] = useState(-1);
  useEffect(() => {
    if (activeReel < 0) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveReel(-1);
      if (event.key === "ArrowRight")
        setActiveReel((index) => (index + 1) % aboutReels.length);
      if (event.key === "ArrowLeft")
        setActiveReel(
          (index) => (index - 1 + aboutReels.length) % aboutReels.length,
        );
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
              <h1>Here to introduce authentic Ayurveda.</h1>
              <p className="info-page-lead">
                Dr. Yogitha’s Intensive Hair Ampoule is crafted using classical
                Taila Paka, with monitored temperature and careful ingredient
                selection. The formulation considers different scalp types and
                individual Prakruthi.
              </p>
              <div className="about-actions">
                <Link className="about-buy-button" to="/#shop">
                  Buy Now
                </Link>
                <a className="about-details-button" href="#about-details">
                  View Details
                </a>
              </div>
            </div>
            <div className="about-image-wrap">
              <img
                src="/about-main-img.webp"
                alt="Dr. Yogitha's Ayurvedic hair oil with botanical ingredients"
              />
            </div>
          </div>
        </div>
      </section>
      <section
        className="about-marquee"
        aria-label="Ayurvedic hair care, botanical oils, mindful rituals, rooted in tradition, made with care"
      >
        <div className="about-marquee-track" aria-hidden="true">
          {[0, 1].map((loop) => (
            <div className="about-marquee-group" key={loop}>
              {[
                "Intensive Hair Ampoule",
                "Rooted in Classical Ayurveda",
                "Prepared Using Taila Paka",
                "Every Ingredient Has a Purpose",
                "Every Degree Matters",
              ].map((item) => (
                <span className="about-marquee-item" key={item}>
                  {item}
                  <i>&#10022;</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="info-page about-page about-page-body">
        <div className="info-page-inner">
          <div className="about-content-section">
            <section
              className="about-journey"
              aria-labelledby="about-journey-title"
            >
              <div
                className="about-journey-collage"
                aria-label="Moments from a mindful hair-care ritual"
              >
                <div className="about-journey-image about-journey-image-main">
                  <img
                    src="/routine-1.webp"
                    alt="Long, healthy-looking hair in a botanical setting"
                    loading="lazy"
                  />
                </div>
                <div className="about-journey-image about-journey-image-top">
                  <img
                    src="/routine-2.webp"
                    alt="Pouring hair oil into the palm of a hand"
                    loading="lazy"
                  />
                </div>
                <div className="about-journey-image about-journey-image-bottom">
                  <img
                    src="/routine-3.webp"
                    alt="Applying oil along the scalp"
                    loading="lazy"
                  />
                </div>
                <div className="about-journey-image about-journey-image-side">
                  <img
                    src="/routine-4.webp"
                    alt="Massaging oil into the scalp as part of a hair-care ritual"
                    loading="lazy"
                  />
                </div>
                <span className="about-journey-seal" aria-hidden="true">
                  <span>DR. YOGITHA&apos;S</span>
                  <i>&#10022;</i>
                  <span>ROOTED IN CARE</span>
                </span>
              </div>
              <div className="about-journey-copy">
                <p className="eyebrow">OUR APPROACH</p>
                <h2 id="about-journey-title">
                  Classical Ayurvedic principles.{" "}
                  <span>guide how we make our oil.</span>
                </h2>
                <p>
                  We believe trust is earned through transparency. We prepare
                  Dr. Yogitha’s Intensive Hair Ampoule using classical Taila
                  Paka and select ingredients according to Rasapanchaka, which
                  considers their qualities and traditional uses. We also take
                  different scalp types and individual Prakruthi into account
                  when formulating the oil.
                </p>
                <div
                  className="about-journey-pillars"
                  aria-label="What guides our approach"
                >
                  <div>
                    <strong>Taila Paka</strong>
                    <span>Classical oil preparation</span>
                  </div>
                  <div>
                    <strong>Rasapanchaka</strong>
                    <span>A guide to ingredient selection</span>
                  </div>
                  <div>
                    <strong>Prakruthi</strong>
                    <span>Individual body constitution</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="about-content-section">
            <div className="about-doctor" id="about-details">
              <img
                className="about-doctor-flower"
                src="/flower-design.webp"
                alt=""
                aria-hidden="true"
              />
              <div className="about-doctor-image">
                <img src="/dr-yogitha.jpg" alt="Dr. Yogitha" loading="lazy" />
                <span className="about-doctor-image-caption">
                  DR. YOGITHA&apos;S &middot; PERSONAL CARE, ROOTED IN TRADITION
                </span>
              </div>
              <div className="about-doctor-copy">
                <p className="eyebrow">A NOTE FROM THE FOUNDER</p>
                <h2>Meet Dr. Yogitha, BAMS</h2>
                <p className="about-doctor-qualification">
                  (Bachelor of Ayurvedic Medicine and Surgery)
                </p>
                <p className="about-doctor-lead">It started in my own home.</p>
                <span className="about-doctor-rule" aria-hidden="true" />
                <p className="about-doctor-body">
                  I made this hair oil for my family, using the herbs,
                  quantities, and preparation method described in a classical
                  Ayurvedic formula. Friends and relatives asked for it first,
                  and when my patients began asking too, I decided to share it.
                  It’s the same oil I use for my family today.
                </p>
                <Link className="about-doctor-link" to="/#shop">
                  Explore the Hair Ampoule{" "}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="about-content-section">
            <section
              className="about-purpose"
              aria-labelledby="about-purpose-title"
            >
              <header className="about-purpose-heading">
                <p className="eyebrow">WHAT GUIDES US</p>
                <h2 id="about-purpose-title">We believe trust is earned through transparency.</h2>
                <span className="about-purpose-rule" aria-hidden="true">
                  <i>&#10022;</i>
                </span>
              </header>
              <div className="about-purpose-grid">
                <article className="about-purpose-panel about-purpose-vision">
                  <p className="eyebrow">OUR VISION</p>
                  <h3>Help people make informed hair-care choices.</h3>
                  <p>
                    We help people understand their scalp’s needs, what goes into their hair care, and how it’s made.
                  </p>
                  <span className="about-purpose-leaf" aria-hidden="true">
                    <Leaf size={230} strokeWidth={1} />
                  </span>
                </article>
                <article className="about-purpose-panel about-purpose-mission">
                  <p className="eyebrow">OUR MISSION</p>
                  <h3>Bring classical Ayurveda to everyday hair care.</h3>
                  <p>
                    We prepare our Intensive Hair Ampoule using Taila Paka, with carefully selected ingredients and monitored temperatures.
                  </p>
                  <span className="about-purpose-signoff">
                    DR. YOGITHA&apos;S <i>·</i> ROOTED IN CLASSICAL AYURVEDA
                  </span>
                </article>
              </div>
            </section>
          </div>
          <div className="about-content-section">
            <section
              className="about-ritual-guide"
              aria-labelledby="about-ritual-guide-title"
            >
              <header className="about-ritual-guide-heading">
                <div>
                  <p className="eyebrow">EVERYDAY HAIR CARE</p>
                  <h2 id="about-ritual-guide-title">From scalp massage to towel drying</h2>
                  <p>
                    Start by understanding what your hair and scalp need. Then choose a care routine that suits those needs.
                  </p>
                </div>
                <div className="about-ritual-guide-art" aria-hidden="true">
                  <img src="/how-to-use-banner.webp" alt="" loading="lazy" />
                </div>
              </header>
              <div className="about-ritual-guide-grid">
                {ritualSteps.map(({ title, note, text, Icon }, index) => (
                  <article className="about-ritual-step" key={title}>
                    <span className="about-ritual-step-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="about-ritual-step-icon">
                      <Icon aria-hidden="true" strokeWidth={1.35} />
                    </span>
                    <div>
                      <h3>
                        {title}
                        {note && <small>{note}</small>}
                      </h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="about-ritual-guide-signature" aria-hidden="true">
                <Leaf />
                <span>Rooted in Ayurveda</span>
                <i>&bull;</i>
                <span>Backed by science</span>
                <i>&bull;</i>
                <span>Made with care</span>
              </div>
            </section>
          </div>
          <div className="about-content-section">
            <section
              className="about-explore"
              aria-labelledby="about-explore-title"
            >
              <header className="about-explore-heading">
                <p className="eyebrow">A RITUAL, ROOTED IN CARE</p>
                <h2 id="about-explore-title">Explore &amp; Shop</h2>
                <span aria-hidden="true" />
              </header>
              <div className="about-explore-grid">
                {aboutReels.map((reel, index) => (
                  <button
                    className="about-explore-card"
                    type="button"
                    onClick={() => setActiveReel(index)}
                    key={`${reel.video}-${index}`}
                    aria-label={`Play video: ${reel.title}`}
                  >
                    <video
                      src={reel.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <div className="about-standards-wrap">
        <section
          className="about-standards"
          aria-labelledby="about-standards-title"
        >
          <h2 id="about-standards-title">
            <Leaf size={20} aria-hidden="true" />
            How we formulate our ampoule
          </h2>
          <div className="about-standards-grid">
            {aboutStandards.map(({ title, Icon }) => (
              <div className="about-standard" key={title}>
                <span className="about-standard-icon">
                  <Icon size={43} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <strong>{title}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <AboutIngredientStory />
      <div className="about-content-section">
        <section
          className="about-cinematic-ritual"
          aria-label="Dr. Yogitha's botanical ritual video"
        >
          <div
            className="about-cinematic-ritual-film"
            aria-label="Dr. Yogitha's botanical ritual video"
          >
            <iframe
              src="https://www.youtube-nocookie.com/embed/jAOvro8WSt4?autoplay=1&mute=1&controls=0&loop=1&playlist=jAOvro8WSt4&playsinline=1&rel=0&modestbranding=1"
              title="Dr. Yogitha's botanical ritual video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      </div>
      <HomeSocialGallery />
      <div className="about-content-section about-ritual-cta-section">
        <section
          className="about-ritual-cta"
          aria-labelledby="about-ritual-cta-title"
        >
          <div className="about-ritual-cta-copy">
            <p className="eyebrow">	INTENSIVE HAIR AMPOULE</p>
            <h2 id="about-ritual-cta-title">
              	Your experience.Your results. Your verdict.
            </h2>
            <p>
              	Prepared using classical Taila Paka, with ingredients chosen with different scalp types and individual Prakruthi in mind.
            </p>
            <Link className="about-ritual-cta-button" to="/#shop">
              	Explore the Ampoule <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="about-ritual-cta-art" aria-hidden="true">
            <img src="/about-cta.webp" alt="" loading="lazy" />
          </div>
          <span className="about-ritual-cta-note" aria-hidden="true">
            DR. YOGITHA&apos;S <i>&middot;</i> ROOTED IN CLASSICAL AYURVEDA
          </span>
        </section>
      </div>
      {activeReel >= 0 && (
        <div
          className="about-reel-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={aboutReels[activeReel].title}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveReel(-1);
          }}
        >
          <button
            className="about-reel-close"
            type="button"
            onClick={() => setActiveReel(-1)}
            aria-label="Close video"
          >
            <X size={21} />
          </button>
          <button
            className="about-reel-nav about-reel-prev"
            type="button"
            onClick={() =>
              setActiveReel(
                (activeReel - 1 + aboutReels.length) % aboutReels.length,
              )
            }
            aria-label="Previous video"
          >
            <ChevronLeft size={32} />
          </button>
          <article
            className="about-reel-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              key={aboutReels[activeReel].video}
              src={aboutReels[activeReel].video}
              controls
              autoPlay
              muted
              playsInline
            />
          </article>
          <button
            className="about-reel-nav about-reel-next"
            type="button"
            onClick={() => setActiveReel((activeReel + 1) % aboutReels.length)}
            aria-label="Next video"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
      <HomeFaq variant="about" />
    </>
  );
}
