"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Discovery } from "@/data/types/discovery";
import type { Room } from "@/data/types/discovery";
import { resolveFeaturedView } from "@/data/discoverySearch";
import { StoryBanner } from "./StoryBanner";
import { GreenroadWallet } from "./GreenroadWallet";
import { OvalGlowBackdrop } from "./OvalGlowBackdrop";
import { FeaturedDiscovery } from "./FeaturedDiscovery";
import { EcosystemOrbitRenderer } from "./EcosystemOrbitRenderer";
import { DiscoveryAccordions } from "./DiscoveryAccordions";
import { ContinueExploring } from "./ContinueExploring";
import {
  CommandSearch,
  type CommandSearchHandle,
} from "./CommandSearch";
import "@/app/styles/home.css";
import "@/app/styles/ecosystem-orbit.css";

interface HomePageProps {
  discovery: Discovery;
}

export function HomePage({ discovery }: HomePageProps) {
  const [activeEcosystem, setActiveEcosystem] = useState<Room>(discovery.room);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedDiscovery, setPinnedDiscovery] = useState<Discovery | null>(
    null,
  );

  const contextRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const stageCenterRef = useRef<HTMLDivElement>(null);
  const isOrbitAnimationPaused = useRef(false);
  const commandRef = useRef<CommandSearchHandle>(null);

  const featuredView = useMemo(
    () =>
      resolveFeaturedView(activeEcosystem, searchQuery, pinnedDiscovery),
    [activeEcosystem, searchQuery, pinnedDiscovery],
  );

  const accordionDiscovery =
    featuredView.mode === "discovery" ? featuredView.discovery : discovery;

  const scrollToContext = useCallback(() => {
    contextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToJoin = useCallback(() => {
    document
      .getElementById("join-section")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => commandRef.current?.focusEmail(), 400);
  }, []);

  const handleEcosystemSelect = useCallback((room: Room) => {
    setActiveEcosystem(room);
    setPinnedDiscovery(null);
    setSearchQuery("");
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSearchSelect = useCallback((d: Discovery) => {
    setPinnedDiscovery(d);
    setActiveEcosystem(d.room);
    setSearchQuery(d.title);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleContinueExplore = useCallback((room: Room) => {
    setActiveEcosystem(room);
    setPinnedDiscovery(null);
    setSearchQuery("");
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="home-page">
      <StoryBanner />
      <GreenroadWallet onJoinClick={scrollToJoin} />

      <div className="home-main">
        <section
          ref={stageRef}
          className="discovery-stage"
          aria-label="Featured discovery and ecosystems"
        >
          <div ref={stageCenterRef} className="discovery-stage__frame">
            <OvalGlowBackdrop
              containerRef={stageCenterRef}
              intensity={0.88}
              zIndex={0}
            />
            <div className="discovery-stage__center">
              {featuredView.mode === "discovery" ? (
                <FeaturedDiscovery
                  mode="discovery"
                  discovery={featuredView.discovery}
                  onLearnMore={scrollToContext}
                  onJoin={scrollToJoin}
                />
              ) : (
                <FeaturedDiscovery
                  mode="coming-into-view"
                  ecosystem={featuredView.ecosystem}
                  onJoin={scrollToJoin}
                />
              )}
            </div>
          </div>
          <EcosystemOrbitRenderer
            activeEcosystem={activeEcosystem}
            onSelect={handleEcosystemSelect}
            stageCenterRef={stageCenterRef}
            isOrbitAnimationPaused={isOrbitAnimationPaused}
          />
          <p className="discovery-stage__hint">
            Ecosystems orbit this discovery — tap a room to explore
          </p>
        </section>

        {featuredView.mode === "discovery" && (
          <section ref={contextRef}>
            <DiscoveryAccordions discovery={accordionDiscovery} />
          </section>
        )}

        {featuredView.mode === "coming-into-view" && (
          <section className="discovery-context-placeholder">
            <p className="discovery-context-placeholder__text">
              Discovery context will appear here as we publish discoveries for
              this ecosystem.
            </p>
          </section>
        )}

        <ContinueExploring onExplore={handleContinueExplore} />
      </div>

      <CommandSearch
        ref={commandRef}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPinnedDiscovery(null);
        }}
        onSelectDiscovery={handleSearchSelect}
      />
    </div>
  );
}
