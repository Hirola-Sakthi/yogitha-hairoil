import { useState } from "react";
import { Hand, MoonStar, Pipette, Wind } from "lucide-react";
import { imageUrl } from "../shared/imageUrl";
import "./home-ritual-guide.css";

const steps = [
  {
    title: "Apply the oil",
    eyebrow: "STEP 01",
    duration: null,
    copy: "Apply a small amount to your scalp, then distribute it evenly through the lengths of your hair in gentle sections.",
    image: "ritual-apply.webp",
    alt: "Golden hair oil being applied with a dropper at the scalp",
    Icon: Pipette,
  },
  {
    title: "Massage gently",
    eyebrow: "STEP 02",
    duration: "4 MIN",
    copy: "Use your fingertips to gently massage your scalp for four minutes, moving in slow circular motions from the roots outward.",
    image: "ritual-massage.webp",
    alt: "Hands gently massaging oil into long dark hair",
    Icon: Hand,
  },
  {
    title: "Leave on before washing",
    eyebrow: "STEP 03",
    duration: "ABOUT 45 MIN",
    copy: "Leave the oil on your scalp and hair for about 45 minutes, allowing it to settle before washing as usual.",
    image: "ritual-rest.webp",
    alt: "A restful hair oil ritual scene with towel, botanicals, and braided hair",
    Icon: MoonStar,
  },
  {
    title: "Dry gently",
    eyebrow: "STEP 04",
    duration: null,
    copy: "Pat your hair dry with a soft cotton towel, then let it air-dry where possible to avoid harsh rubbing or pulling.",
    image: "ritual-wash.webp",
    alt: "A gentle hair-care ritual scene with botanical oil and a soft towel",
    Icon: Wind,
  },
];

export default function HomeRitualGuide() {
  const [activeIndex, setActiveIndex] = useState(0);

  const active = steps[activeIndex];
  return (
    <section
      className="home-ritual-story"
      aria-labelledby="home-ritual-story-title"
    >
      <div className="home-ritual-story-inner">
        <div className="home-ritual-visual" aria-live="polite">
          <img
            key={active.image}
            src={imageUrl(`${import.meta.env.BASE_URL}${active.image}`)}
            alt={active.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="home-ritual-story-copy">
          <p className="eyebrow">THE OILING RITUAL</p>
          <h2 id="home-ritual-story-title">How to use</h2>
          <p className="home-ritual-story-intro">
            Gently massage the oil into your scalp and distribute it evenly
            through your hair.
          </p>
          <div className="home-ritual-prescription">
            <span>HOW OFTEN TO OIL</span>
            <strong>
              Dry scalp: 2–3 times a week.
              <br />
              Normal scalp: 1–2 times a week.
              <br />
              Oily scalp: Once a week or as needed, using a small amount.
            </strong>
          </div>
          <div className="home-ritual-step-list">
            {steps.map((step, index) => {
              const Icon = step.Icon;
              const isActive = index === activeIndex;
              return (
                <button
                  className={`home-ritual-step${isActive ? " is-active" : ""}`}
                  key={step.title}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="home-ritual-step-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="home-ritual-step-content">
                    <small>
                      {step.eyebrow}
                      {step.duration && <i>{step.duration}</i>}
                    </small>
                    <strong>{step.title}</strong>
                    <span>{step.copy}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
