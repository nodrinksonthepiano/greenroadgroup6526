"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Discovery } from "@/data/types/discovery";
import type { Room } from "@/data/types/discovery";
import {
  resolveFeaturedView,
  getDiscoveriesForEcosystem,
  getCustomProductIndex,
} from "@/data/discoverySearch";
import { getRoomBackground } from "@/data/roomBackgrounds";
import { StoryBanner } from "./StoryBanner";
import { GreenroadWallet } from "./GreenroadWallet";
import { OvalGlowBackdrop } from "./OvalGlowBackdrop";
import { FeaturedDiscovery } from "./FeaturedDiscovery";
import { CustomGoodsStation } from "./CustomGoodsStation";
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
  const [customIndex, setCustomIndex] = useState(0);

  const customProducts = useMemo(
    () => getDiscoveriesForEcosystem("custom"),
    [],
  );

  const contextRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const stageCenterRef = useRef<HTMLDivElement>(null);
  const isOrbitAnimationPaused = useRef(false);
  const commandRef = useRef<CommandSearchHandle>(null);

  const handleCustomIndexChange = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(customProducts.length - 1, index));
      setCustomIndex(clamped);
      setPinnedDiscovery(
        clamped === 0 ? null : customProducts[clamped] ?? null,
      );
    },
    [customProducts],
  );

  const featuredView = useMemo(
    () =>
      resolveFeaturedView(activeEcosystem, searchQuery, pinnedDiscovery),
    [activeEcosystem, searchQuery, pinnedDiscovery],
  );

  const accordionDiscovery =
    featuredView.mode === "discovery" ? featuredView.discovery : discovery;

  const isCustomMode = activeEcosystem === "custom";

  useEffect(() => {
    if (!isCustomMode || pinnedDiscovery) return;
    if (!searchQuery.trim()) {
      setCustomIndex(0);
      return;
    }
    if (featuredView.mode !== "discovery") return;
    const { discovery: d } = featuredView;
    if (d.room === "custom") {
      setCustomIndex(getCustomProductIndex(d.slug, customProducts));
    }
  }, [
    isCustomMode,
    searchQuery,
    pinnedDiscovery,
    featuredView,
    customProducts,
  ]);

  const scrollToContext = useCallback(() => {
    contextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToJoin = useCallback(() => {
    document
      .getElementById("join-section")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => commandRef.current?.focusEmail(), 400);
  }, []);

  const handleEcosystemSelect = useCallback(
    (room: Room) => {
      setActiveEcosystem(room);
      setPinnedDiscovery(null);
      setSearchQuery("");
      if (room === "custom") {
        setCustomIndex(0);
      }
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [],
  );

  const handleSearchSelect = useCallback(
    (d: Discovery) => {
      setPinnedDiscovery(d);
      setActiveEcosystem(d.room);
      setSearchQuery(d.title);
      if (d.room === "custom") {
        setCustomIndex(getCustomProductIndex(d.slug, customProducts));
      }
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [customProducts],
  );

  const handleContinueExplore = useCallback((room: Room) => {
    setActiveEcosystem(room);
    setPinnedDiscovery(null);
    setSearchQuery("");
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const featuredDiscoveryNode =
    featuredView.mode === "discovery" ? (
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
    );

  return (
    <div className="home-page">
      <div className="room-backdrop" aria-hidden>
        <div
          className="room-backdrop__image"
          style={{
            backgroundImage: `url("${getRoomBackground(activeEcosystem)}")`,
          }}
        />
        <div className="room-backdrop__scrim" />
        <div className="room-backdrop__bookend room-backdrop__bookend--top" />
        <div className="room-backdrop__bookend room-backdrop__bookend--bottom" />
      </div>
      <header className="home-header">
        <div className="home-header__topbar">
          <div className="home-header__toolbar">
            <GreenroadWallet onJoinClick={scrollToJoin} />
          </div>
          <StoryBanner />
          <Link href="/" className="home-header__brand" aria-label="Greenroad">
            <span className="home-header__brand-frame" aria-hidden>
              <Image
                src="/greenroadgrouplogo6226.png"
                alt=""
                width={28}
                height={28}
                className="greenroad-logo-mark"
                priority
              />
            </span>
          </Link>
        </div>
      </header>

      <div className="home-main">
        <section
          ref={stageRef}
          className={`discovery-stage${isCustomMode ? " discovery-stage--custom" : ""}`}
          aria-label="Featured discovery and ecosystems"
        >
          <div
            ref={stageCenterRef}
            className={`discovery-stage__frame${isCustomMode ? " discovery-stage__frame--custom" : ""}`}
          >
            <OvalGlowBackdrop
              containerRef={stageCenterRef}
              intensity={0.88}
              zIndex={0}
            />
            {isCustomMode && featuredView.mode === "discovery" ? (
              <CustomGoodsStation
                frameRef={stageCenterRef}
                items={customProducts}
                index={customIndex}
                onIndexChange={handleCustomIndexChange}
                onLearnMore={scrollToContext}
                onJoin={scrollToJoin}
              />
            ) : (
              <div className="discovery-stage__center">
                {featuredDiscoveryNode}
              </div>
            )}
          </div>
          <EcosystemOrbitRenderer
            activeEcosystem={activeEcosystem}
            onSelect={handleEcosystemSelect}
            stageCenterRef={stageCenterRef}
            isOrbitAnimationPaused={isOrbitAnimationPaused}
          />
          {!isCustomMode && (
            <p className="discovery-stage__hint">
              Ecosystems orbit this discovery — tap a room to explore
            </p>
          )}
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
          if (activeEcosystem === "custom" && !value.trim()) {
            setCustomIndex(0);
          }
        }}
        onSelectDiscovery={handleSearchSelect}
      />
    </div>
  );
}
