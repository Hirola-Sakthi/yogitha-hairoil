import "./manufacturing-registry.css";

const registryItems = [
  {
    label: "COLOUR",
    value: "Are all green hair oils the same?",
    note: "They can differ in quality, ingredients, and intended use.",
  },
  { label: "PREPARATION METHOD", value: "	Is mixing herbs into oil the same as Sneha Paka?", note: "Sneha Paka follows specific proportions and preparation stages." },
  {
    label: "TEMPERATURE",
    value: "Does higher heat make a better oil?",
    note: "Excessive heat can affect the oil’s quality and its heat-sensitive compounds.",
  },
  {
    label: "INGREDIENT PROPORTIONS",
    value: "Does ingredient quantity matter?",
    note: "Classical Ayurvedic preparation considers how much of each ingredient goes into the formula.",
  },
];

export default function ManufacturingRegistry() {
  return (
    <section
      className="manufacturing-registry"
      aria-labelledby="manufacturing-registry-title"
    >
      <div className="manufacturing-registry-inner">
        <div className="manufacturing-registry-intro">
          <p className="eyebrow">MYTHS & FACTS</p>
          <h2 id="manufacturing-registry-title">
            What can a hair oil’s colour really tell you?
          </h2>
          <p className="manufacturing-registry-description">
            	Hair oils can look alike even when their ingredients, proportions, and preparation methods differ.
          </p>
          <article className="manufacturing-registry-unit">
            <span>BEFORE YOU CHOOSE</span>
            <strong>Look beyond the colour</strong>
            <p>
              Read the ingredient list and find out how the oil was prepared.
            </p>
          </article>
        </div>
        <div className="manufacturing-registry-grid">
          {registryItems.map((item) => (
            <article className="manufacturing-registry-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>
                {item.note}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
