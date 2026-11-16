import { useState } from "react";
import { Droplets, Hand, MoonStar, Pipette } from "lucide-react";
import { imageUrl } from "../shared/imageUrl";
import "./home-ritual-guide.css";

const steps = [
  {
    title: "Warm the oil",
    eyebrow: "STAGE 01 · PREPARATION",
    duration: "2 MIN",
    copy: "Gently warm the botanical oil between your palms, or place the closed bottle in warm water for two minutes.",
    image: "ritual-warm.png",
    alt: "Warm botanical oil in a brass bowl with amla and hibiscus",
    Icon: Droplets,
  },
  {
    title: "Scalp application",
    eyebrow: "STAGE 02 · APPLICATION",
    duration: "PRECISION PIPETTE",
    copy: "Part hair in small sections. Dispense four to six drops directly onto the roots, then distribute evenly with clean fingertips.",
    image: "ritual-apply.png",
    alt: "Golden hair oil being applied with a dropper at the scalp",
    Icon: Pipette,
  },
  {
    title: "Microcirculation massage",
    eyebrow: "STAGE 03 · ACTIVATION",
    duration: "15 MINUTES",
    copy: "Massage with gentle circular fingertip motions for 15 minutes, giving your scalp a mindful moment of care.",
    image: "ritual-massage.png",
    alt: "Hands gently massaging oil into long dark hair",
    Icon: Hand,
  },
  {
    title: "Restorative infusion",
    eyebrow: "STAGE 04 · INFUSION",
    duration: "45 MIN OR OVERNIGHT",
    copy: "Leave the oil on for at least 45 minutes before cleansing as directed on the pack, or allow it to rest overnight.",
    image: "ritual-rest.png",
    alt: "A restful hair oil ritual scene with towel, botanicals, and braided hair",
    Icon: MoonStar,
  },
];

export default function HomeRitualGuide() {
  const [activeIndex, setActiveIndex] = useState(0);

  const active = steps[activeIndex];
  return (
    <section className="home-ritual-story" aria-labelledby="home-ritual-story-title">
      <div className="home-ritual-story-inner">
        <div className="home-ritual-visual" aria-live="polite">
          <img key={active.image} src={imageUrl(`${import.meta.env.BASE_URL}${active.image}`)} alt={active.alt} loading="lazy" decoding="async" />
        </div>
        <div className="home-ritual-story-copy">
          <p className="eyebrow">THE OILING RITUAL</p>
          <h2 id="home-ritual-story-title">How to use</h2>
          <p className="home-ritual-story-intro">Follow a thoughtful four-step ritual, designed to make every application feel calm, considered, and consistent.</p>
          <div className="home-ritual-prescription"><span>RITUAL CADENCE</span><strong>Repeat at least twice weekly for a consistent hair-care routine.</strong></div>
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
                  <span className="home-ritual-step-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="home-ritual-step-content"><small>{step.eyebrow}<i>{step.duration}</i></small><strong>{step.title}</strong><span>{step.copy}</span></span>
                  <span className="home-ritual-step-number">{String(index + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
