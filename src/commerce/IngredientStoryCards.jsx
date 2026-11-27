import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./ingredient-story-cards.css";

const ingredients = [
  {
    name: "Amalaki (Amla)",
    botanical: "Phyllanthus emblica",
    image: "home-ing-1.webp",
    copy: "	Helps nourish the scalp and supports overall hair health as part of a regular hair-care routine.",
    tone: "amla",
  },
  {
    name: "Bhringaraja (Bhringraj)",
    botanical: "Eclipta alba",
    image: "home-ing-2.webp",
    copy: "	Traditionally used in Ayurvedic hair care to support hair growth and help manage hair fall.",
    tone: "bhringraj",
  },
  {
    name: "Rosemary Essential Oil",
    botanical: "Salvia rosmarinus",
    image: "home-ing-3.webp",
    copy: "Used in hair-care preparations to support scalp health and give the oil its aromatic fragrance.",
    tone: "rosemary",
  },
  {
    name: "Japa (Hibiscus)",
    botanical: "Hibiscus rosa-sinensis",
    image: "home-ing-4.webp",
    copy: "	Helps condition the hair and is traditionally used in scalp care for its cooling and soothing effects.",
    tone: "hibiscus",
  },
];

export default function IngredientStoryCards() {
  return (
    <section className="keystones" aria-labelledby="keystones-title">
      <div className="keystones-inner">
        <header className="keystones-heading">
          <div>
            <p className="eyebrow keystones-kicker">FEATURED INGREDIENTS</p>
            <h2 id="keystones-title">	The right hair care begins with the right understanding.</h2>
          </div>
          <p className="keystones-intro">
            	Before choosing a hair-care product, take time to understand your hair and scalp needs and check the ingredients.
          </p>
        </header>
        <div className="keystones-grid">
          {ingredients.map((ingredient, index) => (
            <article
              className={`keystone-card is-${ingredient.tone}`}
              key={ingredient.name}
            >
              <div className="keystone-image-wrap">
                <span className="keystone-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <img
                  src={`${import.meta.env.BASE_URL}${ingredient.image}`}
                  alt={ingredient.name}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="keystone-copy">
                <h3>{ingredient.name}</h3>
                <p className="keystone-botanical">{ingredient.botanical}</p>
                <p className="keystone-description">{ingredient.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
