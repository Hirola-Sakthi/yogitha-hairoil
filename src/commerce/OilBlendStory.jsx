import "./oil-blend-story.css";

const oils = [
  {
    name: "Narikela (Coconut)",
    botanical: "Cocos nucifera L.",
    copy: "Nourishes and moisturises the scalp and conditions hair.",
    side: "left",
  },
  {
    name: "Rosemary Essential Oil",
    botanical: "Salvia rosmarinus",
    copy: "Used in hair care to support scalp health and add fragrance.",
    side: "left",
  },
  {
    name: "Ushira (Vetiver)",
    botanical: "Chrysopogon zizanioides",
    copy: "Traditionally used for its cooling and soothing effects.",
    side: "right",
  },
];

export default function OilBlendStory() {
  return (
    <section
      className="oil-blend-story"
      aria-labelledby="oil-blend-story-title"
    >
      <div className="oil-blend-story-inner">
        <div className="oil-blend-story-heading">
          <p className="eyebrow">OUR PREPARATION METHOD</p>
          <h2 id="oil-blend-story-title">
            	Every ingredient
            <br />
            has a purpose.
          </h2>
          <p>
           	Thoughtfully formulated with different scalp types and individual Prakruthi in mind.
          </p>
        </div>

        <div className="oil-blend-composition">
          <div className="oil-blend-callouts oil-blend-callouts-left">
            {oils
              .filter((oil) => oil.side === "left")
              .map((oil) => (
                <OilCallout key={oil.name} oil={oil} />
              ))}
          </div>
          <div className="oil-blend-visual" aria-hidden="true">
            <span className="oil-blend-orbit oil-blend-orbit-one" />
            <span className="oil-blend-orbit oil-blend-orbit-two" />
            <img
              src={`${import.meta.env.BASE_URL}oil-dropper.webp`}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className="oil-blend-caption">EVERY DEGREE MATTERS</span>
          </div>
          <div className="oil-blend-callouts oil-blend-callouts-right">
            {oils
              .filter((oil) => oil.side === "right")
              .map((oil) => (
                <OilCallout key={oil.name} oil={oil} />
              ))}
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
