"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Discovery } from "@/data/types/discovery";
import type { Room } from "@/data/types/discovery";
import { getEcosystem } from "@/data/ecosystems";

export type FeaturedViewProps =
  | {
      mode: "discovery";
      discovery: Discovery;
      onLearnMore: () => void;
      onJoin: () => void;
    }
  | {
      mode: "coming-into-view";
      ecosystem: Room;
      onJoin: () => void;
    };

function HeroImage({ discovery }: { discovery: Discovery }) {
  const [imgError, setImgError] = useState(false);
  const ecosystem = getEcosystem(discovery.room);

  useEffect(() => {
    setImgError(false);
  }, [discovery.id, discovery.hero_image]);

  if (imgError) {
    return (
      <div className="featured-discovery__hero-media featured-discovery__hero-media--fallback">
        <div className="featured-discovery__hero-fallback" aria-hidden>
          <span className="featured-discovery__hero-fallback-title">
            {discovery.title}
          </span>
          <span className="featured-discovery__hero-fallback-sub">
            {ecosystem?.tagline ?? "Discovery"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="featured-discovery__hero-media">
      <Image
        src={discovery.hero_image}
        alt={discovery.title}
        fill
        sizes="(max-width: 640px) 320px, 320px"
        className="featured-discovery__hero-img"
        priority
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export function FeaturedDiscovery(props: FeaturedViewProps) {
  if (props.mode === "coming-into-view") {
    const ecosystem = getEcosystem(props.ecosystem);
    return (
      <article className="featured-discovery featured-discovery--coming">
        <div className="featured-discovery__hero featured-discovery__hero--coming">
          <span className="featured-discovery__ecosystem-badge">
            {ecosystem?.tagline ?? "Ecosystem"}
          </span>
        </div>
        <div className="featured-discovery__body">
          <p className="featured-discovery__coming-label">Coming Into View</p>
          <h1 className="featured-discovery__title">
            {ecosystem?.tagline ?? "Ecosystem"}
          </h1>
          <p className="featured-discovery__coming-copy">
            {ecosystem?.coming_into_view}
          </p>
          <div className="featured-discovery__actions">
            <button
              type="button"
              className="featured-discovery__cta-secondary"
              onClick={props.onJoin}
            >
              Join The Green Road
            </button>
          </div>
        </div>
      </article>
    );
  }

  const { discovery, onLearnMore, onJoin } = props;
  const ecosystem = getEcosystem(discovery.room);
  const whyLine = discovery.why_we_like_it[0] ?? "";
  const hookLine = discovery.featured_hook ?? "";

  return (
    <article className="featured-discovery">
      <div className="featured-discovery__hero">
        <HeroImage key={discovery.id} discovery={discovery} />
        <span className="featured-discovery__ecosystem-badge">
          {ecosystem?.tagline ?? "Discovery"}
        </span>
      </div>
      <div className="featured-discovery__body">
        <h1 className="featured-discovery__title">{discovery.title}</h1>
        {hookLine && (
          <p className="featured-discovery__alternative">
            {hookLine} — consider this.
          </p>
        )}
        {whyLine && (
          <>
            <p className="featured-discovery__why-label">Why it&apos;s here</p>
            <p className="featured-discovery__why-copy">{whyLine}</p>
          </>
        )}
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
