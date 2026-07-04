"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Discovery } from "@/data/types/discovery";
import { CustomDiscoveryCarousel } from "./CustomDiscoveryCarousel";

interface CustomGoodsStationProps {
  frameRef: React.RefObject<HTMLElement | null>;
  items: Discovery[];
  index: number;
  onIndexChange: (next: number) => void;
  onLearnMore: () => void;
  onJoin: () => void;
}

function dispatchHeroPinned(w: number, h: number) {
  const detail = { w, h, ts: performance.now() };
  window.dispatchEvent(new CustomEvent("hero:pinned", { detail }));
  requestAnimationFrame(() => {
    window.dispatchEvent(
      new CustomEvent("hero:pinned", { detail: { ...detail, ts: performance.now() } }),
    );
    window.dispatchEvent(new CustomEvent("carousel:stable"));
  });
}

export function CustomGoodsStation({
  frameRef,
  items,
  index,
  onIndexChange,
  onLearnMore,
  onJoin,
}: CustomGoodsStationProps) {
  const lastSizeRef = useRef({ w: 0, h: 0 });

  const measureAndPin = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const last = lastSizeRef.current;
    const dw = Math.abs(w - last.w) / (last.w || 1);
    const dh = Math.abs(h - last.h) / (last.h || 1);
    if (last.w > 0 && dw < 0.03 && dh < 0.03) return;
    lastSizeRef.current = { w, h };
    dispatchHeroPinned(w, h);
  }, [frameRef]);

  const handleSnapSettled = useCallback(() => {
    measureAndPin();
    window.dispatchEvent(new CustomEvent("carousel:stable"));
  }, [measureAndPin]);

  useEffect(() => {
    measureAndPin();
    const el = frameRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => measureAndPin());
    observer.observe(el);
    window.addEventListener("resize", measureAndPin);
    window.addEventListener("orientationchange", measureAndPin);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureAndPin);
      window.removeEventListener("orientationchange", measureAndPin);
    };
  }, [frameRef, measureAndPin]);

  return (
    <div className="custom-goods-station">
      <CustomDiscoveryCarousel
        items={items}
        index={index}
        onIndexChange={onIndexChange}
        onLearnMore={onLearnMore}
        onJoin={onJoin}
        onSnapSettled={handleSnapSettled}
      />
    </div>
  );
}
