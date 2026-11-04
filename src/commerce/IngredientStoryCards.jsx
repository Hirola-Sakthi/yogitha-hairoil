import { Link } from "react-router-dom";
import { imageUrl } from "../shared/imageUrl";
import "./ingredient-story-cards.css";

const cards = [
  {
    tone: "light",
    eyebrow: "THE BOTANICAL STORY",
    title: "Botanical care, rooted in tradition.",
    copy: "Explore the thoughtful inspiration behind our Ayurvedic hair oil.",
    action: "Explore the ingredients",
    href: "#formula",
    image: "ingredient-1.webp",
    alt: "Ayurvedic botanicals and natural ingredients arranged in a garden setting",
  },
  {
    tone: "dark",
    eyebrow: "A MINDFUL HAIR RITUAL",
    title: "A golden blend for your everyday.",
    copy: "Make a little room for care in the rhythm of your day.",
    action: "Discover the hair oil",
    href: "#shop",
    image: "ingredient-2.webp",
    alt: "Golden oil being poured into an amber glass bottle in a lush setting",
  },
];

export default function IngredientStoryCards() {
  return (
    <section className="ingredient-story-section" aria-label="The ingredients behind our hair-care ritual">
      <div className="ingredient-story-grid">
        {cards.map((card) => (
          <article className={`ingredient-story-card is-${card.tone}`} key={card.eyebrow}>
            <div className="ingredient-story-copy">
              <p className="eyebrow">{card.eyebrow}</p>
              <h2>{card.title}</h2>
              <p className="ingredient-story-description">{card.copy}</p>
              <Link className="ingredient-story-link" to={card.href}>
                {card.action}<span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className="ingredient-story-art">
              <img src={imageUrl(`${import.meta.env.BASE_URL}${card.image}`)} alt={card.alt} loading="lazy" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
