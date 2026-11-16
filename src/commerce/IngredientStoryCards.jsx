import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { imageUrl } from "../shared/imageUrl";
import "./ingredient-story-cards.css";

const ingredients = [
  {
    name: "Amla",
    botanical: "Phyllanthus emblica",
    image: "home-ing-1.webp",
    copy: "The bright Indian gooseberry brings generations of botanical care to every ritual.",
    tone: "amla",
  },
  {
    name: "Bhringraj",
    botanical: "Eclipta prostrata",
    image: "home-ing-2.webp",
    copy: "A revered green herb at the heart of time-honoured Ayurvedic hair rituals.",
    tone: "bhringraj",
  },
  {
    name: "Rosemary",
    botanical: "Salvia rosmarinus",
    image: "home-ing-3.webp",
    copy: "An aromatic herb that adds a fresh, mindful note to our botanical ritual.",
    tone: "rosemary",
  },
  {
    name: "Hibiscus",
    botanical: "Hibiscus rosa-sinensis",
    image: "home-ing-4.webp",
    copy: "Vivid petals and lush leaves that make every hair-care moment feel more beautiful.",
    tone: "hibiscus",
  },
];

export default function IngredientStoryCards() {
  return (
    <section className="keystones" aria-labelledby="keystones-title">
      <div className="keystones-inner">
        <header className="keystones-heading">
          <div>
            <p className="eyebrow keystones-kicker">BOTANICAL KEYSTONES</p>
            <h2 id="keystones-title">Nature&apos;s finest, chosen with care.</h2>
          </div>
          <p className="keystones-intro">Inspired by Ayurveda and gathered into one thoughtful ritual for stronger-looking, beautifully cared-for hair.</p>
        </header>
        <div className="keystones-grid">
          {ingredients.map((ingredient, index) => (
            <article className={`keystone-card is-${ingredient.tone}`} key={ingredient.name}>
              <div className="keystone-image-wrap">
                <span className="keystone-number">{String(index + 1).padStart(2, "0")}</span>
                <img src={imageUrl(`${import.meta.env.BASE_URL}${ingredient.image}`)} alt={ingredient.name} loading="lazy" decoding="async" />
              </div>
              <div className="keystone-copy">
                <h3>{ingredient.name}</h3>
                <p className="keystone-botanical">{ingredient.botanical}</p>
                <p className="keystone-description">{ingredient.copy}</p>
              </div>
            </article>
          ))}
        </div>
        <Link className="keystones-link" to="/about#ingredients">Explore our botanical story <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
