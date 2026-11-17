import { imageUrl } from "../shared/imageUrl";
import "./oil-blend-story.css";

const oils = [
  {
    name: "Coconut oil",
    botanical: "Cocos nucifera",
    copy: "A nourishing base that leaves every strand feeling soft, smooth, and cared for.",
    side: "left",
  },
  {
    name: "Rosemary essential oil",
    botanical: "Rosmarinus officinalis",
    copy: "A revitalising aromatic oil chosen for a refreshed scalp ritual.",
    side: "left",
  },
  {
    name: "Vetiver essential oil",
    botanical: "Vetiveria zizanioides",
    copy: "A grounding botanical note that brings depth to the blend and calm to the ritual.",
    side: "right",
  },
];

export default function OilBlendStory() {
  return (
    <section className="oil-blend-story" aria-labelledby="oil-blend-story-title">
      <div className="oil-blend-story-inner">
        <div className="oil-blend-story-heading">
          <p className="eyebrow">THE BOTANICAL BLEND</p>
          <h2 id="oil-blend-story-title">Every drop begins<br />with intention.</h2>
          <p>Three thoughtfully chosen oils come together in one slow, sensorial ritual for your hair.</p>
        </div>

        <div className="oil-blend-composition">
          <div className="oil-blend-callouts oil-blend-callouts-left">
            {oils.filter((oil) => oil.side === "left").map((oil) => <OilCallout key={oil.name} oil={oil} />)}
          </div>
          <div className="oil-blend-visual" aria-hidden="true">
            <span className="oil-blend-orbit oil-blend-orbit-one" />
            <span className="oil-blend-orbit oil-blend-orbit-two" />
            <img src={imageUrl(`${import.meta.env.BASE_URL}oil-dropper.webp`)} alt="" loading="lazy" decoding="async" />
            <span className="oil-blend-caption">A concentrated botanical ritual</span>
          </div>
          <div className="oil-blend-callouts oil-blend-callouts-right">
            {oils.filter((oil) => oil.side === "right").map((oil) => <OilCallout key={oil.name} oil={oil} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function OilCallout({ oil }) {
  return (
    <article className="oil-blend-callout">
      <span className="oil-blend-marker" aria-hidden="true" />
      <div>
        <h3>{oil.name}</h3>
        <em>{oil.botanical}</em>
        <p>{oil.copy}</p>
      </div>
    </article>
  );
}
