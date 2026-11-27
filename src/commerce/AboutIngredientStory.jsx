import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Leaf,
  Sprout,
} from "lucide-react";
import "./about-ingredient-story.css";

const ingredients = [
  {
    name: "Hibiscus",
    title: "Japa (Hibiscus)",
    botanical: "Hibiscus rosa-sinensis",
    image: "ing-4.webp",
    note: "A little flower. A beautiful ritual.",
    description:
      "Helps condition the hair and is traditionally used to soothe the scalp.",
    details:
      "Known for its unmistakable red blooms, hibiscus has a place in many traditional botanical preparations. Here, we celebrate the flower, the plant, and the care rituals that have grown around it.",
  },
  {
    name: "Bhringraj",
    title: "Bhringaraja (Bhringraj)",
    botanical: "Eclipta prostrata",
    image: "ing-1.webp",
    note: "Small flowers. Deep-rooted tradition.",
    description:
      "Traditionally used in Ayurvedic hair care to support hair growth.",
    details:
      "Look closely and you will find small, white flower heads nestled among the leaves. This understated botanical is a familiar name in traditional hair oils and a reminder of the richness of plant-based care.",
  },
  {
    name: "Amla",
    title: "Amalaki (Amla)",
    botanical: "Phyllanthus emblica",
    image: "ing-2.webp",
    note: "A treasured fruit. A timeless ritual.",
    description: "Used to nourish the scalp and support hair health.",
    details:
      "Amla's rounded, gently ribbed fruits grow on a leafy tree. From family traditions to botanical hair-care preparations, this familiar fruit carries a long cultural connection to everyday care.",
  },
  {
    name: "Neem",
    title: "Nimba (Neem)",
    botanical: "Azadirachta indica",
    image: "ing-3.webp",
    note: "Evergreen inspiration. Thoughtful care.",
    description: "Traditionally used in scalp care for dandruff and itching.",
    details:
      "Neem is a leafy tree with a distinctive branching form. Its place in traditional personal care reflects a long-standing interest in the plants that grow around us and the rituals they inspire.",
  },
  {
    name: "Rosemary",
    title: "Rosemary Essential Oil",
    botanical: "Salvia rosmarinus",
    image: "ing-5.webp",
    note: "An aromatic herb. A moment of calm.",
    description: "Used in hair-care preparations for scalp care and fragrance.",
    details:
      "Rosemary is an evergreen herb recognised for its narrow leaves and fresh, woody aroma. Its familiar botanical silhouette invites a closer look at the textures and details of the natural world.",
  },
  {
    name: "Curry Leaf",
    title: "Karivepa (Curry Leaves)",
    botanical: "Murraya koenigii",
    image: "ing-6.webp",
    note: "Glossy leaves. A fragrant green ritual.",
    description:
      "Traditionally used to nourish the scalp and support natural hair colour.",
    details:
      "Murraya koenigii is recognised for its glossy, aromatic leaflets and branching form. We include it here as part of a broader story of botanical texture and mindful care.",
  },
  {
    name: "Moringa",
    title: "Shigru (Moringa)",
    botanical: "Moringa oleifera",
    image: "ing-7.webp",
    note: "Leaf by leaf. Naturally considered.",
    description:
      "Used in traditional preparations to cleanse and nourish the scalp.",
    details:
      "Known as a fast-growing tree with delicate compound leaves, Moringa is a familiar part of many botanical landscapes and rituals of everyday care.",
  },
  {
    name: "Lotus",
    title: "Padma (Lotus)",
    botanical: "Nelumbo nucifera",
    image: "ing-8.webp",
    note: "A bloom that invites stillness.",
    description:
      "Traditionally used for its cooling and soothing effects on the scalp.",
    details:
      "The lotus is admired for its generous petals and distinctive central seed pod. Its graceful form brings a sense of calm to this botanical collection.",
  },
  {
    name: "Almond Oil",
    title: "Almond Oil",
    botanical: "Prunus dulcis",
    image: "ing-9.webp",
    note: "A familiar nut. A thoughtful touch.",
    description:
      "Helps moisturise dry hair and scalp and leaves hair feeling softer.",
    details:
      "With its textured shell and warm, earthy tones, almond is a longstanding part of botanical and culinary traditions across many cultures.",
  },
  {
    name: "Black Seed",
    title: "Kalajaji (Black Seed)",
    botanical: "Nigella sativa",
    image: "ing-10.webp",
    note: "Tiny seeds. A deep-rooted story.",
    description: "Traditionally used in scalp care for dandruff and itching.",
    details:
      "Nigella sativa is recognised by its small, dark seeds. Here it is celebrated for its distinctive appearance and connection to traditional botanical practices.",
  },
];
const asset = (name) => `${import.meta.env.BASE_URL}${name}`;

export default function AboutIngredientStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const buttons = useRef([]);
  const selected = ingredients[activeIndex];
  const select = (index) =>
    setActiveIndex((index + ingredients.length) % ingredients.length);

  function navigate(event, index) {
    const directions = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next;
    if (event.key in directions)
      next =
        (index + directions[event.key] + ingredients.length) %
        ingredients.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ingredients.length - 1;
    else return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus();
  }

  return (
    <section
      className="botanical-story"
      id="ingredients"
      aria-labelledby="botanical-title"
    >
      <img
        className="botanical-foliage botanical-foliage-top"
        src={asset("botanical-corner-foliage.png")}
        alt=""
        loading="lazy"
        aria-hidden="true"
      />
      <img
        className="botanical-foliage botanical-foliage-bottom"
        src={asset("botanical-corner-foliage.png")}
        alt=""
        loading="lazy"
        aria-hidden="true"
      />
      <div className="botanical-inner">
        <header className="botanical-heading">
          <p className="eyebrow botanical-eyebrow">INSIDE THE AMPOULE</p>
          <h2 id="botanical-title">
            Get to know our <em>ingredients</em>
          </h2>
          <p>
            Explore the ingredients in Dr. Yogitha’s Intensive Hair Ampoule and their traditional uses in hair and scalp care.
          </p>
        </header>
        <div className="botanical-layout">
          <div className="botanical-selector">
            <div
              className="botanical-orbit"
              style={{
                "--choice-size": `${Math.min(23, 175 / ingredients.length)}%`,
              }}
              role="group"
              aria-label="Choose an ingredient. Use arrow keys to explore."
            >
              <div className="botanical-orbit-line" aria-hidden="true" />
              <div className="botanical-orbit-inner" aria-hidden="true" />
              <div className="botanical-heart" aria-hidden="true">
                <div className="botanical-drop">
                  <Droplets size={66} strokeWidth={1} />
                </div>
                <p>
                  <strong>Every ingredient has a purpose.</strong>
                </p>
                <span className="botanical-heart-rule">
                  <i />
                  <Leaf size={18} strokeWidth={1} />
                  <i />
                </span>
              </div>
              {ingredients.map((ingredient, index) => {
                const angle =
                  (index / ingredients.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <button
                    key={ingredient.name}
                    ref={(element) => {
                      buttons.current[index] = element;
                    }}
                    type="button"
                    className={`botanical-choice${activeIndex === index ? " is-active" : ""}`}
                    style={{
                      "--orbit-x": `${50 + Math.cos(angle) * 37}%`,
                      "--orbit-y": `${50 + Math.sin(angle) * 37}%`,
                    }}
                    aria-pressed={activeIndex === index}
                    aria-controls="botanical-detail"
                    onClick={() => select(index)}
                    onKeyDown={(event) => navigate(event, index)}
                  >
                    <img src={asset(ingredient.image)} alt="" loading="lazy" />
                    <span>{ingredient.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="botanical-selector-hint">
              <span /> Select an ingredient to learn more.
            </p>
          </div>
          <article
            className="botanical-detail"
            id="botanical-detail"
            aria-label="Selected ingredient"
          >
            <div className="botanical-card-toolbar">
              <span className="botanical-card-eyebrow">
                INGREDIENT LIBRARY
              </span>
              <div className="botanical-card-controls">
                <span>
                  <strong>{String(activeIndex + 1).padStart(2, "0")}</strong> /{" "}
                  {String(ingredients.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  aria-label="Previous ingredient"
                  onClick={() => select(activeIndex - 1)}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Next ingredient"
                  onClick={() => select(activeIndex + 1)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="botanical-card-content" key={selected.name}>
              <div className="botanical-card-hero">
                <div className="botanical-card-image">
                  <img
                    src={asset(selected.image)}
                    alt={selected.name}
                    loading="lazy"
                  />
                </div>
                <div className="botanical-card-title">
                  <span>MEET THE INGREDIENT</span>
                  <h3>{selected.title}</h3>
                  <p className="botanical-latin">{selected.botanical}</p>
                  <p className="botanical-note">{selected.note}</p>
                </div>
              </div>
              <div className="botanical-divider" aria-hidden="true">
                <span />
                <Sprout size={19} strokeWidth={1.2} />
                <span />
              </div>
              <p className="botanical-description">{selected.description}</p>
              <div className="botanical-ingredient-details">
                <span>INGREDIENT DETAILS</span>
                <p>{selected.details}</p>
              </div>
            </div>
          </article>
        </div>
        <p className="botanical-announcement" role="status" aria-live="polite">
          {selected.name} selected. Ingredient {activeIndex + 1} of{" "}
          {ingredients.length}.
        </p>
      </div>
    </section>
  );
}
