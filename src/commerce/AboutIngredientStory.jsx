import { useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flower2,
  Leaf,
  Sparkles,
  Sprout,
} from "lucide-react";
import { imageUrl } from "../shared/imageUrl";
import "./about-ingredient-story.css";

// Sample editorial content. Replace with the confirmed formula and approved copy.
const ingredients = [
  {
    name: "Hibiscus",
    botanical: "Hibiscus rosa-sinensis",
    image: "ing-4.webp",
    note: "A little flower. A beautiful ritual.",
    description:
      "Vivid petals, lush green leaves, and a long connection to traditional hair-care rituals. Hibiscus brings a beautiful botanical character to the story of our oil.",
    details:
      "Known for its unmistakable red blooms, hibiscus has a place in many traditional botanical preparations. Here, we celebrate the flower, the plant, and the care rituals that have grown around it.",
    traits: [
      "Floral botanical",
      "Petals & leaves",
      "Ritual inspired",
      "Nature's colour",
    ],
  },
  {
    name: "Bhringraj",
    botanical: "Eclipta prostrata",
    image: "ing-1.webp",
    note: "Small flowers. Deep-rooted tradition.",
    description:
      "A humble green herb with delicate white flowers, Bhringraj is closely associated with Ayurvedic hair-care traditions. Its story is one of simple ingredients and time-honoured rituals.",
    details:
      "Look closely and you will find small, white flower heads nestled among the leaves. This understated botanical is a familiar name in traditional hair oils and a reminder of the richness of plant-based care.",
    traits: [
      "Leafy botanical",
      "White blossoms",
      "Ayurvedic roots",
      "Traditional care",
    ],
  },
  {
    name: "Amla",
    botanical: "Phyllanthus emblica",
    image: "ing-2.webp",
    note: "A treasured fruit. A timeless ritual.",
    description:
      "Also known as Indian gooseberry, Amla is a bright green fruit woven into generations of Ayurvedic tradition. Its distinctive shape and fresh character make it an instantly recognisable botanical.",
    details:
      "Amla's rounded, gently ribbed fruits grow on a leafy tree. From family traditions to botanical hair-care preparations, this familiar fruit carries a long cultural connection to everyday care.",
    traits: [
      "Indian gooseberry",
      "Fruit botanical",
      "Heritage inspired",
      "Everyday ritual",
    ],
  },
  {
    name: "Neem",
    botanical: "Azadirachta indica",
    image: "ing-3.webp",
    note: "Evergreen inspiration. Thoughtful care.",
    description:
      "Recognised by its slender, serrated leaves, Neem is a familiar part of India's botanical landscape. Its green, earthy character brings a connection to nature and traditional personal-care rituals.",
    details:
      "Neem is a leafy tree with a distinctive branching form. Its place in traditional personal care reflects a long-standing interest in the plants that grow around us and the rituals they inspire.",
    traits: [
      "Green leaves",
      "Tree botanical",
      "Earthy character",
      "Traditional ritual",
    ],
  },
  {
    name: "Rosemary",
    botanical: "Salvia rosmarinus",
    image: "ing-5.webp",
    note: "An aromatic herb. A moment of calm.",
    description:
      "Fine, needle-like leaves and delicate flowers give Rosemary its distinctive character. This aromatic herb adds another chapter to a botanical story inspired by mindful, unhurried care.",
    details:
      "Rosemary is an evergreen herb recognised for its narrow leaves and fresh, woody aroma. Its familiar botanical silhouette invites a closer look at the textures and details of the natural world.",
    traits: [
      "Aromatic herb",
      "Evergreen leaves",
      "Woody character",
      "Mindful ritual",
    ],
  },
  {
    name: "Curry Leaf",
    botanical: "Murraya koenigii",
    image: "ing-6.webp",
    note: "Glossy leaves. A fragrant green ritual.",
    description:
      "Curry leaves bring a fresh, verdant chapter to our botanical library, celebrating the beauty of simple leaves and their place in Indian botanical traditions.",
    details:
      "Murraya koenigii is recognised for its glossy, aromatic leaflets and branching form. We include it here as part of a broader story of botanical texture and mindful care.",
    traits: [
      "Aromatic leaves",
      "Glossy foliage",
      "Garden grown",
      "Quiet ritual",
    ],
  },
  {
    name: "Moringa",
    botanical: "Moringa oleifera",
    image: "ing-7.webp",
    note: "Leaf by leaf. Naturally considered.",
    description:
      "Moringa's rounded leaflets and branching silhouette offer another connection to the richness of plant-led personal-care traditions.",
    details:
      "Known as a fast-growing tree with delicate compound leaves, Moringa is a familiar part of many botanical landscapes and rituals of everyday care.",
    traits: [
      "Compound leaves",
      "Green botanical",
      "Tree inspired",
      "Everyday care",
    ],
  },
  {
    name: "Lotus",
    botanical: "Nelumbo nucifera",
    image: "ing-8.webp",
    note: "A bloom that invites stillness.",
    description:
      "Soft pink petals and a golden centre make lotus a beautiful symbol of pause, care, and considered personal rituals.",
    details:
      "The lotus is admired for its generous petals and distinctive central seed pod. Its graceful form brings a sense of calm to this botanical collection.",
    traits: [
      "Pink petals",
      "Floral beauty",
      "Calm ritual",
      "Golden centre",
    ],
  },
  {
    name: "Almond",
    botanical: "Prunus dulcis",
    image: "ing-9.webp",
    note: "A familiar nut. A thoughtful touch.",
    description:
      "Almond is a recognisable natural ingredient whose warm colour and tactile form belong beautifully in a story of everyday care.",
    details:
      "With its textured shell and warm, earthy tones, almond is a longstanding part of botanical and culinary traditions across many cultures.",
    traits: [
      "Earthy texture",
      "Natural nut",
      "Warm tones",
      "Botanical story",
    ],
  },
  {
    name: "Black Seed",
    botanical: "Nigella sativa",
    image: "ing-10.webp",
    note: "Tiny seeds. A deep-rooted story.",
    description:
      "Black seed adds a bold, textural contrast to our botanical library and reflects a long history of plant-based traditions.",
    details:
      "Nigella sativa is recognised by its small, dark seeds. Here it is celebrated for its distinctive appearance and connection to traditional botanical practices.",
    traits: [
      "Dark seeds",
      "Textural detail",
      "Heritage inspired",
      "Botanical ritual",
    ],
  },
];
const traitIcons = [Leaf, Flower2, Sprout, Sparkles];
const asset = (name) => imageUrl(`${import.meta.env.BASE_URL}${name}`);

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
          <p className="eyebrow botanical-eyebrow">POWERED BY NATURE</p>
          <h2 id="botanical-title">
            Rooted in Ayurveda.
            <br className="botanical-mobile-break" /> <em>Rich in nature.</em>
          </h2>
          <p>
            A closer look at the botanicals behind a beautiful hair-care ritual.
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
                <span className="botanical-heart-kicker">
                  THE ART OF BOTANICAL CARE
                </span>
                <p>
                  Pure inspiration.
                  <br />
                  <em>Thoughtful rituals.</em>
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
              <span /> Select a botanical. Discover its story.
            </p>
          </div>
          <article
            className="botanical-detail"
            id="botanical-detail"
            aria-label="Selected ingredient"
          >
            <div className="botanical-card-toolbar">
              <span className="botanical-card-eyebrow">
                THE BOTANICAL LIBRARY
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
                  <h3>{selected.name}</h3>
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
              <ul className="botanical-traits">
                {selected.traits.map((trait, index) => {
                  const Icon = traitIcons[index];
                  return (
                    <li key={trait}>
                      <span>
                        <Icon size={25} strokeWidth={1.2} aria-hidden="true" />
                      </span>
                      {trait}
                    </li>
                  );
                })}
              </ul>
              <details className="botanical-more">
                <summary>
                  Know more <ArrowRight size={17} aria-hidden="true" />
                </summary>
                <p>{selected.details}</p>
              </details>
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
