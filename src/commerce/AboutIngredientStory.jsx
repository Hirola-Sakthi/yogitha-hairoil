import { useState } from "react";
import { imageUrl } from "../shared/imageUrl";
import "./about-ingredient-story.css";

const stories = [
  { eyebrow: "AYURVEDIC BOTANICAL", title: "Bhringraj", detail: "A delicate white-flowering herb in the botanical blend.", botanical: "Eclipta prostrata", image: "ing-1.webp", alt: "Green leaves and a cluster of delicate white flowers", fit: "contain" },
  { eyebrow: "INDIAN GOOSEBERRY", title: "Amla", detail: "A bright green fruit cherished in Ayurvedic tradition.", botanical: "Phyllanthus emblica", image: "ing-2.webp", alt: "Green amla fruits and leaves", fit: "contain" },
  { eyebrow: "TRADITIONAL BOTANICAL", title: "Neem", detail: "A classic botanical with fresh green leaves.", botanical: "Azadirachta indica", image: "ing-3.webp", alt: "A branch of green neem leaves and small buds", fit: "contain" },
  { eyebrow: "AYURVEDIC FLOWER", title: "Hibiscus", detail: "A vibrant flower woven into hair-care rituals.", botanical: "Hibiscus \u00d7 rosa-sinensis", image: "ing-4.webp", alt: "A red hibiscus flower with broad green leaves", fit: "contain" },
  { eyebrow: "AROMATIC HERB", title: "Rosemary", detail: "An aromatic herb with a fresh, earthy character.", botanical: "Salvia rosmarinus", image: "ing-5.webp", alt: "A rosemary sprig with narrow leaves and small purple flowers", fit: "contain" },
];

export default function AboutIngredientStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const story = stories[activeIndex];

  return (
    <section className="about-ingredient-section" aria-labelledby="about-ingredient-title">
      <header className="about-ingredient-heading">
        <p className="eyebrow">THE INGREDIENT STORY</p>
        <h2 id="about-ingredient-title">Nature meets <em>ritual.</em></h2>
        <p>Thoughtful inspiration for the moments you set aside for care.</p>
      </header>
      <div className="about-ingredient-layout">
        <div className="about-ingredient-visual" aria-live="polite">
          <div className="about-ingredient-image" key={story.image}>
            <img src={imageUrl(`${import.meta.env.BASE_URL}${story.image}`)} alt={story.alt} style={{ objectFit: story.fit }} />
          </div>
        </div>
        <div className="about-ingredient-timeline" aria-label="Select an ingredient story">
          <span className="about-ingredient-track" aria-hidden="true"><i style={{ top: `${(activeIndex / (stories.length - 1)) * 100}%` }} /></span>
          <div className="about-ingredient-cards">
            {stories.map((item, index) => (
              <button
                className={`about-ingredient-card${activeIndex === index ? " is-active" : ""}`}
                type="button"
                aria-pressed={activeIndex === index}
                key={item.image}
                onClick={() => setActiveIndex(index)}
              >
                <img src={imageUrl(`${import.meta.env.BASE_URL}${item.image}`)} alt="" aria-hidden="true" />
                <span className="about-ingredient-card-copy">
                  <span className="about-ingredient-card-eyebrow">{item.eyebrow}</span>
                  <strong>{item.title}</strong>
                  <span className="about-ingredient-card-detail">{item.detail}</span>
                  <span className="about-ingredient-card-botanical">({item.botanical})</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
