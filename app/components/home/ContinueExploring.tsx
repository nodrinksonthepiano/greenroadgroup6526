const PLACEHOLDER_DISCOVERIES = [
  {
    ecosystem: "Bathroom Ecosystem",
    title: "Betterway Bamboo TP",
    teaser: "Instead of conventional bleached rolls, consider bamboo.",
  },
  {
    ecosystem: "Office Ecosystem",
    title: "NorbSMILE Full Spectrum Light",
    teaser: "Instead of harsh office lighting, consider sunlike spectrum.",
  },
  {
    ecosystem: "Land Ecosystem",
    title: "EGO Z6 Zero-Turn Mower",
    teaser: "Instead of gas lawn care, consider battery-powered mowing.",
  },
] as const;

export function ContinueExploring() {
  return (
    <section className="continue-exploring" aria-label="Continue exploring">
      <h2 className="home-section-title">Continue Exploring</h2>
      <p className="home-section-subtitle">More along the Green Road.</p>

      <div className="continue-exploring__grid">
        {PLACEHOLDER_DISCOVERIES.map((item) => (
          <article key={item.title} className="continue-exploring__card">
            <p className="continue-exploring__card-ecosystem">{item.ecosystem}</p>
            <h3 className="continue-exploring__card-title">{item.title}</h3>
            <p className="continue-exploring__card-teaser">{item.teaser}</p>
            <span className="continue-exploring__card-soon">Coming soon</span>
          </article>
        ))}
      </div>
    </section>
  );
}
