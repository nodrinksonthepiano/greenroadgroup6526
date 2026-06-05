"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
  intensity?: number;
  zIndex?: number;
};

function toRGBA(hex: string, alpha: number) {
  const h = hex.trim();
  if (h.startsWith("#")) {
    const n =
      h.length === 4
        ? h.slice(1).split("").map((c) => c + c).join("")
        : h.slice(1);
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(240, 192, 64, ${alpha})`;
}

export function OvalGlowBackdrop({
  containerRef,
  intensity = 0.9,
  zIndex = 0,
}: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width < 50) return;

    const vw = Math.max(320, window.innerWidth || 0);
    const maxSafeW = Math.max(240, vw - Math.round(vw * 0.1));
    const idealWidth = Math.round(rect.width * 1.28);
    const finalWidth = Math.min(idealWidth, maxSafeW);
    const finalHeight = Math.round(finalWidth * 0.62);

    setBox((prev) =>
      Math.abs(prev.w - finalWidth) < 2 && Math.abs(prev.h - finalHeight) < 2
        ? prev
        : { w: finalWidth, h: finalHeight },
    );
    setReady(true);
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      const retry = window.setTimeout(measure, 0);
      return () => window.clearTimeout(retry);
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, measure]);

  const { wrapperStyle, glowStyle, ringStyle, auraStyle } = useMemo(() => {
    const w = box.w;
    const h = box.h;

    const goldOuter = toRGBA("#f0c040", Math.min(0.38 * intensity, 0.5));
    const greenMid = toRGBA("#52b788", Math.min(0.32 * intensity, 0.42));
    const silverSoft = toRGBA("#c0c8d0", Math.min(0.2 * intensity, 0.28));
    const goldRim = toRGBA("#c9a84c", Math.min(0.24 * intensity, 0.35));

    return {
      wrapperStyle: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: w ? `${w}px` : "0px",
        height: h ? `${h}px` : "0px",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex,
        overflow: "visible",
        transition: "width 0.35s ease, height 0.35s ease",
      } as React.CSSProperties,
      glowStyle: {
        position: "absolute",
        inset: 0,
        borderRadius: "50% / 50%",
        background: "transparent",
        boxShadow: [
          `0 0 120px 32px ${goldOuter}`,
          `0 0 64px 22px ${greenMid}`,
          `0 0 28px 8px ${silverSoft}`,
          `0 0 1px 0 ${goldRim} inset`,
        ].join(", "),
      } as React.CSSProperties,
      ringStyle: {
        position: "absolute",
        inset: 0,
        borderRadius: "50% / 50%",
        background: `radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0) 58%, rgba(240,192,64,${Math.min(0.26 * intensity, 0.34)}) 78%, rgba(192,200,208,${Math.min(0.12 * intensity, 0.18)}) 88%, rgba(255,255,255,0) 98%)`,
        filter: "blur(4px)",
      } as React.CSSProperties,
      auraStyle: {
        position: "absolute",
        inset: "-10%",
        borderRadius: "50% / 50%",
        background: `radial-gradient(ellipse at 50% 50%, rgba(82,183,136,${Math.min(0.14 * intensity, 0.22)}) 0%, rgba(201,168,76,${Math.min(0.1 * intensity, 0.16)}) 40%, transparent 70%)`,
        filter: "blur(20px)",
      } as React.CSSProperties,
    };
  }, [box, intensity, zIndex]);

  if (!ready || !box.w || !box.h) return null;

  return (
    <div aria-hidden className="oval-glow-backdrop" style={wrapperStyle}>
      <div className="oval-glow-backdrop__aura" style={auraStyle} />
      <div className="oval-glow-backdrop__glow" style={glowStyle} />
      <div
        className="oval-glow-backdrop__ring oval-glow-backdrop__ring--pulse"
        style={ringStyle}
      />
    </div>
  );
}
