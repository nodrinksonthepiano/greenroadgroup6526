import type { Room } from "@/data/types/discovery";

const EXPLORE_CARDS: {
  ecosystem: Room;
  ecosystemLabel: string;
  title: string;
  teaser: string;
}[] = [
  {
    ecosystem: "sleep",
    ecosystemLabel: "Sleep Ecosystem",
    title: "Cariloha Resort Bamboo Sheets",
    teaser: "Instead of conventional cotton, consider bamboo cool.",
  },
  {
    ecosystem: "bathroom",
    ecosystemLabel: "Bathroom Ecosystem",
    title: "Betterway Bamboo TP",
    teaser: "Instead of conventional bleached rolls, consider bamboo.",
  },
  {
    ecosystem: "land",
    ecosystemLabel: "Land Ecosystem",
    title: "EGO Z6 Zero-Turn Mower",
    teaser: "Instead of gas lawn care, consider battery-powered mowing.",
  },
];

interface ContinueExploringProps {
  onExplore: (room: Room) => void;
}

export function ContinueExploring({ onExplore }: ContinueExploringProps) {
  return (
    <section className="continue-exploring" aria-label="Continue exploring">
      <h2 className="home-section-title">Continue Exploring</h2>
      <p className="home-section-subtitle">More along the Green Road.</p>

      <div className="continue-exploring__grid">
        {EXPLORE_CARDS.map((item) => (
          <button
            key={item.title}
            type="button"
            className="continue-exploring__card"
            onClick={() => onExplore(item.ecosystem)}
          >
            <p className="continue-exploring__card-ecosystem">
              {item.ecosystemLabel}
            </p>
            <h3 className="continue-exploring__card-title">{item.title}</h3>
            <p className="continue-exploring__card-teaser">{item.teaser}</p>
            <span className="continue-exploring__card-cta">Explore</span>
          </button>
        ))}
      </div>
    </section>
  );
}
