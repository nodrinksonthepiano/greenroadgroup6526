"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Discovery } from "@/data/types/discovery";
import type { Room } from "@/data/types/discovery";
import { getEcosystem } from "@/data/ecosystems";
import { buildCustomQuoteMailto } from "@/data/discoverySearch";
import { getProductCustomization } from "@/data/customization";
import { track } from "@/lib/analytics";
import {
  CustomizerColorControls,
  CustomizerControls,
  CustomizerHero,
  ProductCustomizer,
} from "./customization/ProductCustomizer";

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

  if (imgError || !discovery.hero_image) {
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
        sizes="(max-width: 640px) 300px, 360px"
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
  const displayTitle = discovery.display_title ?? discovery.title;
  const displaySize = discovery.display_size;
  const isCustomInquiry =
    discovery.room === "custom" &&
    discovery.commerce.sale_type === "inquiry";
  const eventHref =
    discovery.type === "event" &&
    discovery.commerce.product_url?.startsWith("/")
      ? discovery.commerce.product_url
      : null;
  const visitHref =
    discovery.commerce.sale_type === "showcase_only" &&
    discovery.commerce.product_url?.startsWith("https://")
      ? discovery.commerce.product_url
      : null;
  const quoteHref = isCustomInquiry
    ? buildCustomQuoteMailto(discovery)
    : null;
  const customization = isCustomInquiry
    ? getProductCustomization(discovery.slug)
    : null;
  const isEvent = Boolean(eventHref);
  const priceLine =
    isCustomInquiry && discovery.commerce.list_price != null
      ? `From $${discovery.commerce.list_price.toFixed(2)} + order fee + shipping estimate`
      : whyLine;

  const article = (
    <article
      className={`featured-discovery${isEvent ? " featured-discovery--event" : ""}`}
    >
      <div className="featured-discovery__hero">
        {customization ? (
          <CustomizerHero />
        ) : (
          <HeroImage key={discovery.id} discovery={discovery} />
        )}
        {customization ? (
          <h1 className="featured-discovery__ecosystem-badge">{displayTitle}</h1>
        ) : (
          <span className="featured-discovery__ecosystem-badge">
            {ecosystem?.tagline ?? "Discovery"}
          </span>
        )}
      </div>
      {customization ? <CustomizerColorControls /> : null}
      <div className="featured-discovery__body">
        {customization ? (
          displaySize ? (
            <p className="featured-discovery__spec">{displaySize}</p>
          ) : null
        ) : (
          <>
            <h1 className="featured-discovery__title">{discovery.title}</h1>
            {hookLine && (
              <p className="featured-discovery__alternative">
                {hookLine}
                {!isEvent && " — consider this."}
              </p>
            )}
          </>
        )}
        {customization ? <CustomizerControls /> : null}
        {priceLine && (
          <>
            <p className="featured-discovery__why-label">
              {isCustomInquiry
                ? "Starting at"
                : eventHref
                  ? "Event details"
                  : "Why it's here"}
            </p>
            <p className="featured-discovery__why-copy">{priceLine}</p>
          </>
        )}
        <div className="featured-discovery__actions">
          {visitHref ? (
            <a
              href={visitHref}
              className="featured-discovery__cta-primary featured-discovery__cta-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("outbound_click", { slug: discovery.slug })}
            >
              Visit Site
            </a>
          ) : eventHref ? (
            <Link
              href={eventHref}
              className="featured-discovery__cta-primary featured-discovery__cta-link"
            >
              Enter Reunion
            </Link>
          ) : quoteHref ? (
            <a
              href={quoteHref}
              className="featured-discovery__cta-primary featured-discovery__cta-link"
            >
              Start a Custom Quote
            </a>
          ) : (
            <button
              type="button"
              className="featured-discovery__cta-primary"
              onClick={onLearnMore}
            >
              Learn More
            </button>
          )}
          {!eventHref && (
            <button
              type="button"
              className="featured-discovery__cta-secondary"
              onClick={visitHref || isCustomInquiry ? onLearnMore : onJoin}
            >
              {visitHref || isCustomInquiry ? "Learn More" : "Join The Green Road"}
            </button>
          )}
        </div>
      </div>
    </article>
  );

  if (!customization) return article;
  return (
    <ProductCustomizer
      customization={customization}
      heroImage={discovery.hero_image}
      heroAlt={
        displaySize ? `${displayTitle}, ${displaySize}` : displayTitle
      }
    >
      {article}
    </ProductCustomizer>
  );
}
