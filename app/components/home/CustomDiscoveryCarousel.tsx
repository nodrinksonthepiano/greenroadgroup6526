"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Discovery } from "@/data/types/discovery";
import { FeaturedDiscovery } from "./FeaturedDiscovery";

const THRESHOLD_PX = 80;
const MAX_PROGRESS = 1.15;
const SNAP_THRESHOLD = 0.55;
const FLIP_EXTRA_MARGIN = 0.03;
const SNAP_MS = 200;
const DRAG_SLOWDOWN = 1.4;
const DRAG_CAP_START = 0.9;
const DRAG_CAP_MAX = 0.99;
const MIN_COMMIT_DIST = 0.08;
const DEAD_ZONE = 0.08;
const TAKEOVER_PX = 12;
const DEFAULT_STEP_PX = 220;
const COMMIT_GUARD_MS = 180;
const VISIBLE_PEEK = 0.44;
const SCALE_ANCHORS = [1.0, 0.5, 0.25, 0.125] as const;

function roundPx(v: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.round(v * dpr) / dpr;
}

/** Zeyoda OrbitPeekCarousel yFor — nonlinear spacing so layers don't move as one rigid block. */
function yPxFromRel(rel: number, cardH: number): number {
  const sign = rel === 0 ? 0 : rel > 0 ? 1 : -1;
  const a = Math.abs(rel);
  const k0 = Math.min(3, Math.floor(a));
  const k1 = Math.min(3, k0 + 1);
  const t = Math.max(0, Math.min(1, a - k0));
  const s0 = SCALE_ANCHORS[k0];
  const s1 = SCALE_ANCHORS[k1];
  const yFor = (k: number, sK: number, sgn: number) => {
    if (k === 0 || sgn === 0) return 0;
    return sgn * (0.5 * cardH + sK * (0.5 - VISIBLE_PEEK) * cardH);
  };
  const y0 = yFor(k0, s0, sign === 0 ? 1 : sign);
  const y1 = yFor(k1, s1, sign === 0 ? 1 : sign);
  return roundPx(y0 + (y1 - y0) * t);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function softCapProgress(raw: number): number {
  const sign = raw < 0 ? -1 : 1;
  const a = Math.min(Math.abs(raw), DRAG_CAP_MAX);
  if (a <= DRAG_CAP_START) return sign * a;
  const t = Math.min(1, (a - DRAG_CAP_START) / (DRAG_CAP_MAX - DRAG_CAP_START));
  const eased = DRAG_CAP_START + (1 - (1 - t) * (1 - t)) * (DRAG_CAP_MAX - DRAG_CAP_START);
  return sign * eased;
}

function wrapIndex(idx: number, count: number): number {
  if (count <= 0) return 0;
  return ((idx % count) + count) % count;
}

function capProgress(progress: number): number {
  return softCapProgress(clamp(progress, -MAX_PROGRESS, MAX_PROGRESS));
}

function shortTitle(title: string): string {
  return title
    .replace(/^POD\s+/i, "")
    .replace(/\s+Full Color$/i, "")
    .trim();
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as Element | null;
  return !!el?.closest?.("a, button, input, textarea, label");
}

function CarouselPeekCard({
  discovery,
  onSelect,
}: {
  discovery: Discovery;
  onSelect: () => void;
}) {
  const price = discovery.commerce.list_price;

  return (
    <button
      type="button"
      className="custom-discovery-carousel__peek"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="custom-discovery-carousel__peek-thumb">
        <Image
          src={discovery.hero_image}
          alt=""
          fill
          sizes="80px"
          className="custom-discovery-carousel__peek-img"
        />
      </div>
      <span className="custom-discovery-carousel__peek-title">
        {shortTitle(discovery.title)}
      </span>
      {price != null && (
        <span className="custom-discovery-carousel__peek-price">
          From ${price.toFixed(2)}
        </span>
      )}
    </button>
  );
}

interface CustomDiscoveryCarouselProps {
  items: Discovery[];
  index: number;
  onIndexChange: (next: number) => void;
  onLearnMore: () => void;
  onJoin: () => void;
  onSnapSettled?: () => void;
}

export function CustomDiscoveryCarousel({
  items,
  index,
  onIndexChange,
  onLearnMore,
  onJoin,
  onSnapSettled,
}: CustomDiscoveryCarouselProps) {
  const count = items.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const stepPxRef = useRef(DEFAULT_STEP_PX);
  const cardHeightRef = useRef(0);
  const pinnedStepRef = useRef(0);
  const pinnedActiveRef = useRef(false);
  const flattenStageRef = useRef(false);
  const isVisibleRef = useRef(true);
  const viewportChangeTimerRef = useRef<number | null>(null);
  const centerMeasureRef = useRef<HTMLDivElement>(null);

  const [effectiveIndex, setEffectiveIndex] = useState(index);
  const effectiveIndexRef = useRef(index);
  const progressRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastPRef = useRef(0);
  const draggingRef = useRef(false);
  const dragPendingRef = useRef(false);
  const snappingRef = useRef(false);
  const snapLockRef = useRef(false);
  const loopRef = useRef<number | null>(null);
  const dirtyRef = useRef(true);
  const guardUntilRef = useRef(0);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const wheelIdleTimerRef = useRef<number | null>(null);
  const gestureIdRef = useRef(0);
  const bodyLockRef = useRef(0);
  const wheelDragActiveRef = useRef(false);
  const snapRef = useRef({
    active: false,
    start: 0,
    from: 0,
    to: 0,
    dur: SNAP_MS,
  });

  useEffect(() => {
    effectiveIndexRef.current = effectiveIndex;
  }, [effectiveIndex]);

  const lockBodyScroll = useCallback(() => {
    try {
      bodyLockRef.current++;
      document.body.classList.add("carousel-scroll-lock");
      document.body.style.overscrollBehavior = "none";
    } catch {
      /* ignore */
    }
  }, []);

  const unlockBodyScroll = useCallback(() => {
    try {
      bodyLockRef.current = Math.max(0, bodyLockRef.current - 1);
      if (bodyLockRef.current === 0) {
        document.body.classList.remove("carousel-scroll-lock");
        document.body.style.overscrollBehavior = "";
      }
    } catch {
      /* ignore */
    }
  }, []);

  const writeFrame = useCallback(() => {
    const p = progressRef.current;
    const cardH = cardHeightRef.current;
    if (cardH < 80) return;

    for (let offset = -1; offset <= 1; offset++) {
      const el = layerRefs.current.get(offset);
      if (!el) continue;

      const rel = offset + p;
      const dist = Math.abs(rel);
      const scale = clamp(1 - dist * 0.14, 0.68, 1);
      const opacity = clamp(1 - dist * 0.42, 0.38, 1);
      const yPx = yPxFromRel(rel, cardH);

      el.style.opacity = String(opacity);
      el.style.pointerEvents =
        dist < 0.5 && !snappingRef.current ? "auto" : "none";
      el.style.zIndex = String(20 - Math.round(dist * 6));
      el.style.transform = `translate3d(-50%, calc(-50% + ${yPx.toFixed(1)}px), 0) scale(${scale.toFixed(3)})`;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (loopRef.current !== null) return;
    const ease = (t: number) => 1 - (1 - t) ** 3;

    const tick = (now: number) => {
      loopRef.current = requestAnimationFrame(tick);
      if (snapRef.current.active) {
        const { start, from, to, dur } = snapRef.current;
        const t = clamp((now - start) / dur, 0, 1);
        progressRef.current = from + (to - from) * ease(t);
        if (t >= 1) snapRef.current.active = false;
        dirtyRef.current = true;
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        writeFrame();
        return;
      }
      if (!draggingRef.current && !snapRef.current.active) {
        if (loopRef.current !== null) cancelAnimationFrame(loopRef.current);
        loopRef.current = null;
      }
    };
    loopRef.current = requestAnimationFrame(tick);
  }, [writeFrame]);

  useEffect(() => {
    if (performance.now() >= guardUntilRef.current) {
      effectiveIndexRef.current = index;
      setEffectiveIndex(index);
      progressRef.current = 0;
      dirtyRef.current = true;
      startLoop();
    }
  }, [index, startLoop]);

  const measureStep = useCallback(() => {
    if (flattenStageRef.current && pinnedStepRef.current > 80) {
      stepPxRef.current = pinnedStepRef.current;
      if (!cardHeightRef.current) {
        cardHeightRef.current = Math.round(pinnedStepRef.current / 0.52);
      }
      dirtyRef.current = true;
      startLoop();
      return;
    }
    const el = centerMeasureRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    if (h > 80) {
      cardHeightRef.current = h;
      const step = Math.round(h * 0.52);
      stepPxRef.current = step;
      const prev = pinnedStepRef.current;
      if (
        !pinnedActiveRef.current ||
        !prev ||
        Math.abs(step - prev) / prev > 0.05
      ) {
        pinnedStepRef.current = step;
        pinnedActiveRef.current = true;
      }
      dirtyRef.current = true;
      startLoop();
    }
  }, [startLoop]);

  const flattenOnViewportChange = useCallback(() => {
    flattenStageRef.current = true;
    draggingRef.current = false;
    dragPendingRef.current = false;
    wheelDragActiveRef.current = false;
    progressRef.current = 0;
    velocityRef.current = 0;
    if (wheelIdleTimerRef.current) {
      window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = null;
    }
    unlockBodyScroll();
    dirtyRef.current = true;
    startLoop();
    if (viewportChangeTimerRef.current) {
      window.clearTimeout(viewportChangeTimerRef.current);
    }
    viewportChangeTimerRef.current = window.setTimeout(() => {
      flattenStageRef.current = false;
      dirtyRef.current = true;
      startLoop();
    }, 80);
  }, [startLoop, unlockBodyScroll]);

  useEffect(() => {
    measureStep();
    const el = centerMeasureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureStep());
    ro.observe(el);
    return () => ro.disconnect();
  }, [effectiveIndex, measureStep]);

  const runSnapTo = useCallback(
    (to: number) =>
      new Promise<void>((resolve) => {
        snappingRef.current = true;
        snapLockRef.current = true;
        snapRef.current = {
          active: true,
          start: performance.now(),
          from: progressRef.current,
          to,
          dur: SNAP_MS,
        };
        dirtyRef.current = true;
        startLoop();
        const wait = () => {
          if (!snapRef.current.active) resolve();
          else requestAnimationFrame(wait);
        };
        requestAnimationFrame(wait);
      }),
    [startLoop],
  );

  const commitIndex = useCallback(
    async (dir: number) => {
      const base = effectiveIndexRef.current;
      const next = wrapIndex(base + dir, count);

      lockBodyScroll();
      // Swipe down (positive p) → next; swipe up → previous. Snap completes at p=±1.
      await runSnapTo(dir > 0 ? +1 : -1);
      writeFrame();
      effectiveIndexRef.current = next;
      setEffectiveIndex(next);
      onIndexChange(next);
      progressRef.current = 0;
      writeFrame();
      dirtyRef.current = true;
      startLoop();
      snappingRef.current = false;
      snapLockRef.current = false;
      velocityRef.current = 0;
      guardUntilRef.current = performance.now() + COMMIT_GUARD_MS;
      unlockBodyScroll();
      onSnapSettled?.();
    },
    [
      count,
      lockBodyScroll,
      onIndexChange,
      onSnapSettled,
      runSnapTo,
      startLoop,
      unlockBodyScroll,
      writeFrame,
    ],
  );

  const endDrag = useCallback(
    async (allowFlip: boolean) => {
      if (count <= 1) {
        progressRef.current = 0;
        dirtyRef.current = true;
        startLoop();
        return;
      }
      draggingRef.current = false;
      dragPendingRef.current = false;
      unlockBodyScroll();
      if (wheelIdleTimerRef.current) {
        window.clearTimeout(wheelIdleTimerRef.current);
        wheelIdleTimerRef.current = null;
      }

      const p = progressRef.current;
      const v = velocityRef.current;
      const s = p + 0.25 * v;
      const commitThreshold = SNAP_THRESHOLD + FLIP_EXTRA_MARGIN;
      const trigger =
        allowFlip &&
        Math.abs(s) >= commitThreshold &&
        Math.abs(p) >= MIN_COMMIT_DIST;

      if (Math.abs(p) < DEAD_ZONE) {
        lockBodyScroll();
        await runSnapTo(0);
        progressRef.current = 0;
        snappingRef.current = false;
        snapLockRef.current = false;
        unlockBodyScroll();
        onSnapSettled?.();
        return;
      }

      if (!trigger) {
        lockBodyScroll();
        await runSnapTo(0);
        snappingRef.current = false;
        snapLockRef.current = false;
        unlockBodyScroll();
        onSnapSettled?.();
        return;
      }

      const dir = s > 0 ? +1 : -1;
      await commitIndex(dir);
    },
    [
      commitIndex,
      count,
      lockBodyScroll,
      onSnapSettled,
      runSnapTo,
      startLoop,
      unlockBodyScroll,
    ],
  );

  const setProgressFromGesture = useCallback(
    (next: number, dt: number) => {
      const now = performance.now();
      const v = (next - lastPRef.current) / Math.max(dt, 0.001);
      velocityRef.current = 0.6 * v + 0.4 * velocityRef.current;
      lastTsRef.current = now;
      lastPRef.current = next;
      progressRef.current = next;
      dirtyRef.current = true;
      startLoop();
    },
    [startLoop],
  );

  /** Touch: set progress from total displacement since gesture start (Zeyoda-style). */
  const applyTouchDisplacement = useCallback(
    (displacementY: number, dt: number) => {
      const raw = displacementY / (THRESHOLD_PX * DRAG_SLOWDOWN);
      const next = capProgress(raw);
      setProgressFromGesture(next, dt);
    },
    [setProgressFromGesture],
  );

  /** Wheel: accumulate incremental deltas between events. */
  const applyWheelDelta = useCallback(
    (deltaY: number, dt: number) => {
      const delta = deltaY / (THRESHOLD_PX * DRAG_SLOWDOWN);
      const next = capProgress(progressRef.current + delta);
      setProgressFromGesture(next, dt);
    },
    [setProgressFromGesture],
  );

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (count <= 1 || snappingRef.current || snapLockRef.current) return;
      if (!isVisibleRef.current || flattenStageRef.current) return;
      if (isInteractiveTarget(e.target)) return;
      draggingRef.current = false;
      dragPendingRef.current = true;
      gestureIdRef.current++;
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      lastTsRef.current = performance.now();
      lastPRef.current = progressRef.current;
    },
    [count],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (count <= 1 || snappingRef.current || snapLockRef.current) return;
      if (!isVisibleRef.current || flattenStageRef.current) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      if (dragPendingRef.current && !draggingRef.current) {
        const dx = Math.abs(x - startXRef.current);
        const dy = Math.abs(y - startYRef.current);
        if (dy > TAKEOVER_PX && dy > dx * 1.2) {
          draggingRef.current = true;
          dragPendingRef.current = false;
          lockBodyScroll();
          e.preventDefault();
        } else {
          return;
        }
      }
      if (!draggingRef.current) return;
      e.preventDefault();
      const now = performance.now();
      const dt = Math.max(0.008, Math.min(0.08, (now - lastTsRef.current) * 0.001));
      applyTouchDisplacement(y - startYRef.current, dt);
    },
    [applyTouchDisplacement, count, lockBodyScroll],
  );

  const onTouchEnd = useCallback(() => {
    if (draggingRef.current || dragPendingRef.current) void endDrag(true);
    else dragPendingRef.current = false;
    if (!draggingRef.current && !wheelDragActiveRef.current && !snappingRef.current) {
      unlockBodyScroll();
    }
  }, [endDrag, unlockBodyScroll]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (isInteractiveTarget(e.target)) return;
      if (count <= 1) {
        e.preventDefault();
        return;
      }
      if (
        snappingRef.current ||
        snapLockRef.current ||
        !isVisibleRef.current ||
        flattenStageRef.current
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (!wheelDragActiveRef.current) {
        wheelDragActiveRef.current = true;
        lockBodyScroll();
      }
      gestureIdRef.current++;
      const currentGesture = gestureIdRef.current;
      const now = performance.now();
      const dt = Math.max(0.008, Math.min(0.08, (now - lastTsRef.current) * 0.001));
      if (Math.abs(e.deltaY) >= 2) {
        applyWheelDelta(-e.deltaY, dt);
      }
      if (wheelIdleTimerRef.current) window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = window.setTimeout(() => {
        if (gestureIdRef.current !== currentGesture) return;
        void endDrag(true);
        wheelDragActiveRef.current = false;
      }, 120);
    },
    [applyWheelDelta, count, endDrag, lockBodyScroll],
  );

  const snapToIndex = useCallback(
    async (target: number) => {
      const current = effectiveIndexRef.current;
      const wrapped = wrapIndex(target, count);
      if (wrapped === current || snappingRef.current) return;
      const forward = (wrapped - current + count) % count;
      const backward = (current - wrapped + count) % count;
      const dir = forward <= backward ? 1 : -1;
      await commitIndex(dir);
    },
    [commitIndex, count],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || count <= 1) return;

    const onTouchMoveBlockScroll = (e: TouchEvent) => {
      if (
        draggingRef.current &&
        !isInteractiveTarget(e.target) &&
        !flattenStageRef.current
      ) {
        e.preventDefault();
      }
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd);
    root.addEventListener("touchcancel", onTouchEnd);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchmove", onTouchMoveBlockScroll, { passive: false });
    window.addEventListener("scroll", flattenOnViewportChange, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        const vis = !!(entries[0] && entries[0].intersectionRatio >= 0.85);
        isVisibleRef.current = vis;
        if (!vis && !draggingRef.current && !snappingRef.current) {
          progressRef.current = 0;
          dirtyRef.current = true;
          startLoop();
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 0.85, 1] },
    );
    try {
      io.observe(root);
    } catch {
      /* ignore */
    }

    const vv = window.visualViewport;
    const onVV = () => flattenOnViewportChange();
    if (vv) {
      try {
        vv.addEventListener("resize", onVV);
        vv.addEventListener("scroll", onVV);
      } catch {
        /* ignore */
      }
    }

    dirtyRef.current = true;
    startLoop();

    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchmove", onTouchMoveBlockScroll);
      window.removeEventListener("scroll", flattenOnViewportChange);
      try {
        io.disconnect();
      } catch {
        /* ignore */
      }
      if (vv) {
        try {
          vv.removeEventListener("resize", onVV);
          vv.removeEventListener("scroll", onVV);
        } catch {
          /* ignore */
        }
      }
      if (viewportChangeTimerRef.current) {
        window.clearTimeout(viewportChangeTimerRef.current);
        viewportChangeTimerRef.current = null;
      }
      bodyLockRef.current = 0;
      document.body.classList.remove("carousel-scroll-lock");
      document.body.style.overscrollBehavior = "";
      if (loopRef.current !== null) cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    };
  }, [
    count,
    flattenOnViewportChange,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    onWheel,
    startLoop,
  ]);

  if (count <= 1) {
    const item = items[0];
    if (!item) return null;
    return (
      <FeaturedDiscovery
        mode="discovery"
        discovery={item}
        onLearnMore={onLearnMore}
        onJoin={onJoin}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      className="custom-discovery-carousel"
      aria-roledescription="carousel"
      aria-label="Custom goods"
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
    >
      <div ref={stageRef} className="custom-discovery-carousel__stage">
        {([-1, 0, 1] as const).map((offset) => {
          const discovery = items[wrapIndex(effectiveIndex + offset, count)];
          const isHero = offset === 0;

          return (
            <div
              key={offset}
              ref={(el) => {
                if (el) layerRefs.current.set(offset, el);
                else layerRefs.current.delete(offset);
              }}
              className={`custom-discovery-carousel__layer${isHero ? " custom-discovery-carousel__layer--hero" : ""}`}
              aria-hidden={!discovery}
            >
              {discovery &&
                (isHero ? (
                  <div ref={centerMeasureRef} className="custom-discovery-carousel__hero-wrap">
                    <FeaturedDiscovery
                      mode="discovery"
                      discovery={discovery}
                      onLearnMore={onLearnMore}
                      onJoin={onJoin}
                    />
                  </div>
                ) : (
                  <CarouselPeekCard
                    discovery={discovery}
                    onSelect={() => {
                      const target = wrapIndex(
                        effectiveIndexRef.current + offset,
                        count,
                      );
                      void snapToIndex(target);
                    }}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
