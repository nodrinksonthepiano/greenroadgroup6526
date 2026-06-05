"use client";

import type { Discovery } from "@/data/types/discovery";
import { getEcosystem } from "@/data/ecosystems";

interface FeaturedDiscoveryProps {
  discovery: Discovery;
  onLearnMore: () => void;
  onJoin: () => void;
}

export function FeaturedDiscovery({
  discovery,
  onLearnMore,
  onJoin,
}: FeaturedDiscoveryProps) {
  const ecosystem = getEcosystem(discovery.room);
  const problemLine = discovery.problem_solved[0] ?? "";
  const alternativeLine = discovery.alternative_to[0] ?? "";

  return (
    <article className="featured-discovery">
      <div className="featured-discovery__hero">
        <span className="featured-discovery__ecosystem-badge">
          {ecosystem?.tagline ?? "Office Ecosystem"}
        </span>
      </div>
      <div className="featured-discovery__body">
        <h1 className="featured-discovery__title">{discovery.title}</h1>
        {alternativeLine && (
          <p className="featured-discovery__alternative">
            Instead of {alternativeLine.toLowerCase()}, consider this.
          </p>
        )}
        <p className="featured-discovery__problem-label">Problem Solved</p>
        <p className="featured-discovery__problem">{problemLine}</p>
        <div className="featured-discovery__actions">
          <button
            type="button"
            className="featured-discovery__cta-primary"
            onClick={onLearnMore}
          >
            Learn More
          </button>
          <button
            type="button"
            className="featured-discovery__cta-secondary"
            onClick={onJoin}
          >
            Join The Green Road
          </button>
        </div>
      </div>
    </article>
  );
}
