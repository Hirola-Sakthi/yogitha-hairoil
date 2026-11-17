import "./manufacturing-registry.css";

const registryItems = [
  { label: "BATCH IDENTIFIER", value: "DY–2025–042", note: "Verified lab tested", verified: true },
  { label: "MFG. DATE", value: "January 2025", note: "Moonlit harvest batch" },
  { label: "EXPIRY / SHELF-LIFE", value: "December 2026 (24M)", note: "Amber glass stabilized" },
  { label: "QUALITY STANDARD", value: "Ayurvedic GMP", note: "100% organics certified" },
];

export default function ManufacturingRegistry() {
  return (
    <section className="manufacturing-registry" aria-labelledby="manufacturing-registry-title">
      <div className="manufacturing-registry-inner">
        <div className="manufacturing-registry-intro">
          <p className="eyebrow">AUTHENTIC PHARMACY DISCLOSURE</p>
          <h2 id="manufacturing-registry-title">Verified manufacturing <span>&amp; atelier registry</span></h2>
          <p className="manufacturing-registry-description">All formulations are prepared with thoughtful Ayurvedic care and attention to every botanical detail.</p>
          <article className="manufacturing-registry-unit">
            <span>ATELIER &amp; MANUFACTURING UNIT</span>
            <strong>Dr. Yogitha&apos;s Botanical Atelier</strong>
            <p>1–61, Nalgampalle, Bangarupalem, Chittoor District, Andhra Pradesh, India</p>
          </article>
        </div>
        <div className="manufacturing-registry-grid">
          {registryItems.map((item) => (
            <article className="manufacturing-registry-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p className={item.verified ? "is-verified" : undefined}>{item.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
