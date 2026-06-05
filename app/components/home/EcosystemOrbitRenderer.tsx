"use client";

import { useEffect, useMemo, useRef } from "react";
import { ECOSYSTEMS } from "@/data/ecosystems";
import type { Room } from "@/data/types/discovery";

interface EcosystemOrbitRendererProps {
  activeEcosystem: Room;
  onSelect: (id: Room) => void;
  stageCenterRef: React.RefObject<HTMLDivElement | null>;
  isOrbitAnimationPaused: React.MutableRefObject<boolean>;
  orbitRadiusScale?: number;
}

const ORBIT_SPEED = 0.3;
const WHEEL_SENS = 0.0016;
const FRICTION = 1.8;
const V_EPS = 0.003;
const TAP_MOVE_THRESHOLD_SQ = 36;

export function EcosystemOrbitRenderer({
  activeEcosystem,
  onSelect,
  stageCenterRef,
  isOrbitAnimationPaused,
  orbitRadiusScale = 1.12,
}: EcosystemOrbitRendererProps) {
  const tokenElementRefs = useRef<(HTMLElement | null)[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const naturalOffsetRef = useRef(0);
  const userOffsetRef = useRef(0);
  const userVelocityRef = useRef(0);
  const isInteractingRef = useRef(false);
  const dragStartXYRef = useRef<{ x: number; y: number } | null>(null);
  const orbitContainerRef = useRef<HTMLDivElement | null>(null);
  const lastEventTsRef = useRef(0);
  const centerRef = useRef<{ cx: number; cy: number }>({ cx: 0, cy: 0 });
  const lastAngleRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const isHoveringRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const downXYRef = useRef<{ x: number; y: number } | null>(null);
  const draggingTokenRef = useRef(false);
  const hoverPauseTimerRef = useRef<number | null>(null);
  const heroDimensionsRef = useRef<{ w: number; h: number } | null>(null);

  const orbitSlotTokens = useMemo(
    () =>
      ECOSYSTEMS.map((ecosystem) => ({
        id: ecosystem.id,
        label: ecosystem.label,
        tagline: ecosystem.tagline,
      })),
    [],
  );

  useEffect(() => {
    const stageElement = stageCenterRef.current;
    if (!stageElement) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const allTokens = orbitSlotTokens.map((token, index) => ({
      ...token,
      angle: ((index + 0.5) * 360) / (orbitSlotTokens.length || 1),
    }));

    const positionOnce = () => {
      const rect = stageElement.getBoundingClientRect();
      let contentWidth: number;
      let contentHeight: number;

      if (heroDimensionsRef.current) {
        contentWidth = heroDimensionsRef.current.w;
        contentHeight = heroDimensionsRef.current.h;
      } else {
        contentWidth = stageElement.offsetWidth;
        contentHeight = stageElement.offsetHeight;

        const isContentReady =
          contentWidth > 50 && contentHeight > 50 && rect.width > 50;

        if (!isContentReady) {
          contentWidth = Math.min(window.innerWidth * 0.7, 320);
          contentHeight = contentWidth * 1.15;
        }
      }

      centerRef.current = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };

      const scale = orbitRadiusScale;
      const radiusX = (contentWidth / 2 + 60) * scale;
      const radiusY = (contentHeight / 2 + 40) * scale;
      const currentGlobalAngleOffset =
        naturalOffsetRef.current + userOffsetRef.current;

      const orbitContainer = orbitContainerRef.current;
      if (orbitContainer && rect) {
        const anchor = orbitContainer.offsetParent as HTMLElement | null;
        const anchorRect = anchor?.getBoundingClientRect();
        if (anchorRect) {
          const pinLeft = rect.left + rect.width / 2 - anchorRect.left;
          const pinTop = rect.top + rect.height / 2 - anchorRect.top;
          orbitContainer.style.left = `${pinLeft}px`;
          orbitContainer.style.top = `${pinTop}px`;
          orbitContainer.style.width = `${contentWidth}px`;
          orbitContainer.style.height = `${contentHeight}px`;
        }
      }

      allTokens.forEach((tokenData, index) => {
        const tokenElement = tokenElementRefs.current[index];
        if (!tokenElement) return;
        const tokenSpecificInitialAngle =
          (typeof tokenData.angle === "number" ? tokenData.angle : 0) *
          (Math.PI / 180);
        const angle = currentGlobalAngleOffset + tokenSpecificInitialAngle;
        const x = radiusX * Math.cos(angle);
        const y = radiusY * Math.sin(angle);
        const z = -20;
        const orbitPos = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`;
        tokenElement.style.setProperty("--orbit-pos", orbitPos);
        tokenElement.style.opacity = "1";
        tokenElement.style.filter = "blur(0px)";
      });
    };

    let lastTimestamp = 0;
    const animate = (timestamp: number) => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "hidden") {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }
      const deltaTime = (timestamp - lastTimestamp) * 0.001;
      lastTimestamp = timestamp;

      if (!isOrbitAnimationPaused.current && !isInteractingRef.current) {
        naturalOffsetRef.current += ORBIT_SPEED * deltaTime;
      }

      if (!isInteractingRef.current) {
        if (Math.abs(userVelocityRef.current) > V_EPS) {
          userOffsetRef.current += userVelocityRef.current * deltaTime;
          userVelocityRef.current *= Math.max(0, 1 - FRICTION * deltaTime);
        } else if (Math.abs(userOffsetRef.current) > 0.0005) {
          naturalOffsetRef.current += userOffsetRef.current;
          userOffsetRef.current = 0;
          userVelocityRef.current = 0;
        }
      }

      positionOnce();
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    positionOnce();
    animationFrameIdRef.current = requestAnimationFrame(animate);

    const onHeroPinned = (e: Event) => {
      const customEvent = e as CustomEvent<{ w?: number; h?: number }>;
      const { w, h } = customEvent.detail || {};
      if (w && h) {
        heroDimensionsRef.current = { w, h };
        positionOnce();
      }
    };
    window.addEventListener("hero:pinned", onHeroPinned);

    const onStable = () => {
      isOrbitAnimationPaused.current = false;
      positionOnce();
      if (animationFrameIdRef.current === null) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };
    window.addEventListener("carousel:stable", onStable);

    const container = orbitContainerRef.current;
    let cleanupListeners: (() => void) | undefined;

    if (container) {
      const timestampNow = () =>
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const onWheel = (e: WheelEvent) => {
        if (!isInteractingRef.current && !isHoveringRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const now = timestampNow();
        const dt = Math.max(
          0.008,
          Math.min(0.08, (now - (lastEventTsRef.current || now)) * 0.001),
        );
        let sideSign = 1;
        const targetEl = (e.target as Element)?.closest?.(
          ".orbit-token",
        ) as HTMLElement | null;
        if (targetEl) {
          try {
            const tr = targetEl.getBoundingClientRect();
            const tcx = tr.left + tr.width / 2;
            sideSign = tcx >= centerRef.current.cx ? 1 : -1;
          } catch {
            /* ignore */
          }
        }
        const d = -e.deltaY * WHEEL_SENS * sideSign;
        userOffsetRef.current += d;
        const instV = d / dt;
        userVelocityRef.current = 0.6 * userVelocityRef.current + 0.4 * instV;
        lastEventTsRef.current = now;
      };

      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Element;
        if (!target.closest(".orbit-token")) return;
        try {
          orbitContainerRef.current?.setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        isInteractingRef.current = true;
        dragStartXYRef.current = { x: e.clientX, y: e.clientY };
        lastEventTsRef.current = timestampNow();
        const { cx, cy } = centerRef.current;
        lastAngleRef.current = Math.atan2(e.clientY - cy, e.clientX - cx);
        suppressClickRef.current = true;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isInteractingRef.current || !dragStartXYRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const now = timestampNow();
        const { cx, cy } = centerRef.current;
        const ang = Math.atan2(e.clientY - cy, e.clientX - cx);
        if (lastAngleRef.current === null) lastAngleRef.current = ang;
        let deltaAng = ang - lastAngleRef.current;
        if (deltaAng > Math.PI) deltaAng -= 2 * Math.PI;
        else if (deltaAng < -Math.PI) deltaAng += 2 * Math.PI;
        const dt = Math.max(
          0.008,
          Math.min(0.08, (now - (lastEventTsRef.current || now)) * 0.001),
        );
        userOffsetRef.current += deltaAng;
        const instV = deltaAng / dt;
        userVelocityRef.current = 0.6 * userVelocityRef.current + 0.4 * instV;
        dragStartXYRef.current = { x: e.clientX, y: e.clientY };
        lastAngleRef.current = ang;
        lastEventTsRef.current = now;
      };

      const onPointerUp = (e: PointerEvent) => {
        isInteractingRef.current = false;
        dragStartXYRef.current = null;
        try {
          orbitContainerRef.current?.releasePointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        lastAngleRef.current = null;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 30);
      };

      const onTouchStart = (e: TouchEvent) => {
        const target = e.target as Element;
        if (!target.closest(".orbit-token")) return;
        isInteractingRef.current = true;
        const t = e.touches[0];
        dragStartXYRef.current = { x: t.clientX, y: t.clientY };
        lastEventTsRef.current = timestampNow();
        const { cx, cy } = centerRef.current;
        lastAngleRef.current = Math.atan2(t.clientY - cy, t.clientX - cx);
        suppressClickRef.current = true;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isInteractingRef.current || !dragStartXYRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const t = e.touches[0];
        const now = timestampNow();
        const { cx, cy } = centerRef.current;
        const ang = Math.atan2(t.clientY - cy, t.clientX - cx);
        if (lastAngleRef.current === null) lastAngleRef.current = ang;
        let deltaAng = ang - lastAngleRef.current;
        if (deltaAng > Math.PI) deltaAng -= 2 * Math.PI;
        else if (deltaAng < -Math.PI) deltaAng += 2 * Math.PI;
        const dt = Math.max(
          0.008,
          Math.min(0.08, (now - (lastEventTsRef.current || now)) * 0.001),
        );
        userOffsetRef.current += deltaAng;
        const instV = deltaAng / dt;
        userVelocityRef.current = 0.6 * userVelocityRef.current + 0.4 * instV;
        dragStartXYRef.current = { x: t.clientX, y: t.clientY };
        lastAngleRef.current = ang;
        lastEventTsRef.current = now;
      };

      const onTouchEnd = () => {
        isInteractingRef.current = false;
        dragStartXYRef.current = null;
        lastAngleRef.current = null;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 30);
      };

      const onPointerEnter = () => {
        isHoveringRef.current = true;
      };
      const onPointerLeave = () => {
        isHoveringRef.current = false;
      };
      const onClickCapture = (e: MouseEvent) => {
        if (suppressClickRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      container.addEventListener("wheel", onWheel, { passive: false });
      container.addEventListener("pointerdown", onPointerDown, {
        passive: false,
      });
      container.addEventListener("pointermove", onPointerMove, {
        passive: false,
      });
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointerenter", onPointerEnter);
      container.addEventListener("pointerleave", onPointerLeave);
      container.addEventListener("touchstart", onTouchStart, { passive: false });
      container.addEventListener("touchmove", onTouchMove, { passive: false });
      container.addEventListener("touchend", onTouchEnd);
      container.addEventListener("click", onClickCapture, true);

      cleanupListeners = () => {
        container.removeEventListener("wheel", onWheel);
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointerenter", onPointerEnter);
        container.removeEventListener("pointerleave", onPointerLeave);
        container.removeEventListener("touchstart", onTouchStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onTouchEnd);
        container.removeEventListener("click", onClickCapture, true);
      };
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      window.removeEventListener("hero:pinned", onHeroPinned);
      window.removeEventListener("carousel:stable", onStable);
      cleanupListeners?.();
    };
  }, [
    orbitSlotTokens,
    isOrbitAnimationPaused,
    stageCenterRef,
    orbitRadiusScale,
  ]);

  const tokenHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.setAttribute("data-hovered", "true");
      isHoveringRef.current = true;
      if (hoverPauseTimerRef.current) {
        window.clearTimeout(hoverPauseTimerRef.current);
      }
      isOrbitAnimationPaused.current = true;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.setAttribute("data-hovered", "false");
      isHoveringRef.current = false;
      if (hoverPauseTimerRef.current) {
        window.clearTimeout(hoverPauseTimerRef.current);
      }
      hoverPauseTimerRef.current = window.setTimeout(() => {
        if (!isInteractingRef.current) {
          isOrbitAnimationPaused.current = false;
        }
      }, 200);
    },
    onDragStart: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      activePointerIdRef.current = e.pointerId;
      isInteractingRef.current = true;
      draggingTokenRef.current = false;
      downXYRef.current = { x: e.clientX, y: e.clientY };
      const { cx, cy } = centerRef.current;
      lastAngleRef.current = Math.atan2(e.clientY - cy, e.clientX - cx);
      suppressClickRef.current = false;
      (e.currentTarget.style as React.CSSProperties & { cursor?: string }).cursor =
        "grabbing";
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (
        activePointerIdRef.current !== e.pointerId ||
        lastAngleRef.current === null
      ) {
        return;
      }
      const dx = e.clientX - (downXYRef.current?.x ?? e.clientX);
      const dy = e.clientY - (downXYRef.current?.y ?? e.clientY);
      if (!draggingTokenRef.current && dx * dx + dy * dy > 36) {
        draggingTokenRef.current = true;
        suppressClickRef.current = true;
      }
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const dt =
        Math.max(8, Math.min(80, now - (lastEventTsRef.current || now))) *
        0.001;
      const { cx, cy } = centerRef.current;
      const ang = Math.atan2(e.clientY - cy, e.clientX - cx);
      let d = ang - (lastAngleRef.current ?? ang);
      if (d > Math.PI) d -= 2 * Math.PI;
      else if (d < -Math.PI) d += 2 * Math.PI;
      userOffsetRef.current += d;
      userVelocityRef.current = 0.6 * userVelocityRef.current + 0.4 * (d / dt);
      lastAngleRef.current = ang;
      lastEventTsRef.current = now;
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      if (activePointerIdRef.current !== null) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture?.(
            activePointerIdRef.current,
          );
        } catch {
          /* ignore */
        }
      }
      activePointerIdRef.current = null;
      isInteractingRef.current = false;
      draggingTokenRef.current = false;
      lastAngleRef.current = null;
      (e.currentTarget.style as React.CSSProperties & { cursor?: string }).cursor =
        "grab";
      if (hoverPauseTimerRef.current) {
        window.clearTimeout(hoverPauseTimerRef.current);
      }
      hoverPauseTimerRef.current = window.setTimeout(() => {
        isOrbitAnimationPaused.current = false;
      }, 120);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 30);
    },
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };

  return (
    <div className="orbit-theme" style={{ pointerEvents: "none" }}>
      <div
        className="orbital-tokens"
        ref={orbitContainerRef}
        onMouseLeave={() => {
          if (!isInteractingRef.current) {
            isOrbitAnimationPaused.current = false;
          }
        }}
        style={{
          touchAction: "none",
          overscrollBehavior: "contain",
          pointerEvents: "none",
        }}
      >
        {orbitSlotTokens.map((ecosystem, index) => {
          const isActive = ecosystem.id === activeEcosystem;

          return (
            <button
              key={ecosystem.id}
              type="button"
              className={`orbit-token${isActive ? " orbit-token--active" : ""}`}
              data-ecosystem-id={ecosystem.id}
              ref={(el: HTMLElement | null) => {
                tokenElementRefs.current[index] = el;
              }}
              style={{
                willChange: "transform, opacity",
                opacity: 1,
                transform: "var(--orbit-pos, translate(-50%, -50%))",
                pointerEvents: "auto",
              }}
              draggable={false}
              onMouseEnter={tokenHandlers.onMouseEnter}
              onMouseLeave={tokenHandlers.onMouseLeave}
              onDragStart={tokenHandlers.onDragStart}
              onPointerDown={(e) => {
                e.stopPropagation();
                tokenHandlers.onPointerDown(e);
              }}
              onPointerMove={tokenHandlers.onPointerMove}
              onPointerUp={(e) => {
                e.stopPropagation();
                const wasDrag = draggingTokenRef.current;
                const down = downXYRef.current;
                tokenHandlers.onPointerUp(e);
                if (wasDrag || !down) return;
                const dx = e.clientX - down.x;
                const dy = e.clientY - down.y;
                if (dx * dx + dy * dy <= TAP_MOVE_THRESHOLD_SQ) {
                  onSelect(ecosystem.id);
                }
              }}
              onClickCapture={tokenHandlers.onClickCapture}
              aria-pressed={isActive}
              aria-label={ecosystem.tagline}
              title={ecosystem.tagline}
            >
              {ecosystem.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
