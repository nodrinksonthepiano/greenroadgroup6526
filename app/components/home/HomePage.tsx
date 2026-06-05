"use client";

import { useCallback, useRef } from "react";
import type { Discovery } from "@/data/types/discovery";
import { StoryBanner } from "./StoryBanner";
import { GreenroadWallet } from "./GreenroadWallet";
import { OvalGlowBackdrop } from "./OvalGlowBackdrop";
import { FeaturedDiscovery } from "./FeaturedDiscovery";
import { EcosystemOrbitShell } from "./EcosystemOrbit";
import { DiscoveryAccordions } from "./DiscoveryAccordions";
import { ContinueExploring } from "./ContinueExploring";
import { CommandSearch } from "./CommandSearch";
import "@/app/styles/home.css";

interface HomePageProps {
  discovery: Discovery;
}

export function HomePage({ discovery }: HomePageProps) {
  const contextRef = useRef<HTMLElement>(null);

  const scrollToContext = useCallback(() => {
    contextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToJoin = useCallback(() => {
    document
      .getElementById("join-section")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="home-page">
      <StoryBanner />
      <GreenroadWallet onJoinClick={scrollToJoin} />

      <div className="home-main">
        <section className="home-hero" aria-label="Featured discovery">
          <div className="home-hero__glow-wrap">
            <OvalGlowBackdrop />
            <FeaturedDiscovery
              discovery={discovery}
              onLearnMore={scrollToContext}
              onJoin={scrollToJoin}
            />
          </div>
        </section>

        <EcosystemOrbitShell initialRoom={discovery.room} />

        <section ref={contextRef}>
          <DiscoveryAccordions discovery={discovery} />
        </section>

        <ContinueExploring />
      </div>

      <CommandSearch />
    </div>
  );
}
