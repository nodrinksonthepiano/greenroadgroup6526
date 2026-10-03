"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ProductCustomization } from "@/data/customization";
import {
  readCustomizationSession,
  writeCustomizationSession,
  type NormTransform,
} from "./sessionStore";

export const PREVIEW_DISCLAIMER =
  "Preview only. Final artwork and placement are subject to supplier approval before production.";

const BASE_BODY = { r: 254, g: 141, b: 47 };
const BASE_LUM =
  0.299 * BASE_BODY.r + 0.587 * BASE_BODY.g + 0.114 * BASE_BODY.b;
const ETCH = { r: 236, g: 236, b: 232 };
const WHEEL_BURST_MS = 300;
const NORM_EPSILON = 1e-6;

type Phase = "loading" | "restored" | "empty" | "ready";
type SaveStatus = "idle" | "saving" | "saved" | "not-saved" | "session-not-saved";
type LiveArtwork = { blob: Blob; url: string };
type SessionSnapshot = {
  variantId: string;
  areaId: string;
  artwork: Blob | null;
  transforms: Record<string, NormTransform>;
};
type WheelBurst = {
  before: SessionSnapshot;
  timer: number;
};
type DragGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  before: SessionSnapshot;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function isBodyPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat >= 0.35 && r >= g && g >= b && r - b > 25;
}

function recolorBody(
  source: CanvasImageSource,
  width: number,
  height: number,
  swatch: string,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(source, 0, 0, width, height);
  const frame = ctx.getImageData(0, 0, width, height);
  const target = hexToRgb(swatch);
  const data = frame.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (!isBodyPixel(r, g, b)) continue;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const rel = lum / BASE_LUM;
    data[i] = Math.max(0, Math.min(255, Math.round(target.r * rel)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(target.g * rel)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(target.b * rel)));
  }
  ctx.putImageData(frame, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
}

function defaultTransform(): NormTransform {
  return { scale: 1, xNorm: 0, yNorm: 0 };
}

function defaultVariantId(customization: ProductCustomization): string {
  return (
    customization.variants.find((item) => item.code === "ORG")?.id ??
    customization.variants[0].id
  );
}

function cloneTransforms(
  source: Record<string, NormTransform>,
): Record<string, NormTransform> {
  return Object.fromEntries(
    Object.entries(source).map(([id, value]) => [
      id,
      { scale: value.scale, xNorm: value.xNorm, yNorm: value.yNorm },
    ]),
  );
}

function sameTransform(a: NormTransform, b: NormTransform): boolean {
  return (
    Math.abs(a.scale - b.scale) < NORM_EPSILON &&
    Math.abs(a.xNorm - b.xNorm) < NORM_EPSILON &&
    Math.abs(a.yNorm - b.yNorm) < NORM_EPSILON
  );
}

function sameSnapshot(a: SessionSnapshot, b: SessionSnapshot): boolean {
  if (a.variantId !== b.variantId || a.areaId !== b.areaId || a.artwork !== b.artwork) {
    return false;
  }
  const keys = new Set([...Object.keys(a.transforms), ...Object.keys(b.transforms)]);
  for (const key of keys) {
    if (!sameTransform(a.transforms[key] ?? defaultTransform(), b.transforms[key] ?? defaultTransform())) {
      return false;
    }
  }
  return true;
}

function screenOffset(transform: NormTransform, box: { width: number; height: number }) {
  return {
    x: transform.xNorm * box.width,
    y: transform.yNorm * box.height,
  };
}

function toNorm(
  scale: number,
  x: number,
  y: number,
  box: { width: number; height: number },
): NormTransform | null {
  if (box.width < 1 || box.height < 1) return null;
  return { scale, xNorm: x / box.width, yNorm: y / box.height };
}

function acceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/svg+xml" ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".svg")
  );
}

function clampTransform(
  next: { scale: number; x: number; y: number },
  box: DOMRect,
  image: HTMLImageElement,
): { scale: number; x: number; y: number } {
  const scale = Math.max(0.35, Math.min(4, next.scale));
  const naturalWidth = image.naturalWidth || 512;
  const naturalHeight = image.naturalHeight || 512;
  const contain = Math.min(box.width / naturalWidth, box.height / naturalHeight);
  const dw = naturalWidth * contain * scale;
  const dh = naturalHeight * contain * scale;
  const baseLeft = (box.width - dw) / 2;
  const baseTop = (box.height - dh) / 2;
  const margin = 12;
  return {
    scale,
    x: Math.max(margin - dw - baseLeft, Math.min(box.width - margin - baseLeft, next.x)),
    y: Math.max(margin - dh - baseTop, Math.min(box.height - margin - baseTop, next.y)),
  };
}

type CustomizerApi = {
  customization: ProductCustomization;
  phase: Phase;
  ready: boolean;
  showChoice: boolean;
  saveStatus: SaveStatus;
  variantId: string;
  areaId: string;
  artwork: LiveArtwork | null;
  artReady: boolean;
  cupSrc: string;
  cupReady: boolean;
  area: ProductCustomization["areas"][number];
  variant: ProductCustomization["variants"][number];
  transforms: Record<string, NormTransform>;
  undoDepth: number;
  redoDepth: number;
  canUndo: boolean;
  canRedo: boolean;
  historyTick: number;
  selectVariant: (id: string) => void;
  selectArea: (id: string) => void;
  printRef: React.RefObject<HTMLDivElement | null>;
  etchRef: React.RefObject<HTMLCanvasElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  fit: { x: number; y: number; w: number; h: number };
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  nudgeScale: (factor: number) => void;
  resetTransform: () => void;
  undo: () => void;
  redo: () => void;
  onFile: (file: File | undefined) => void;
};

const CustomizerContext = createContext<CustomizerApi | null>(null);

function useCustomizer(): CustomizerApi {
  const value = useContext(CustomizerContext);
  if (!value) throw new Error("Customizer is missing its provider");
  return value;
}

export function ProductCustomizer({
  customization,
  children,
}: {
  customization: ProductCustomization;
  children: ReactNode;
}) {
  const initialVariantId = defaultVariantId(customization);
  const initialAreaId = customization.areas[0].id;
  const initialTransforms = Object.fromEntries(
    customization.areas.map((item) => [item.id, defaultTransform()]),
  );
  const [phase, setPhase] = useState<Phase>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [variantId, setVariantId] = useState(initialVariantId);
  const [areaId, setAreaId] = useState(initialAreaId);
  const [artwork, setArtwork] = useState<LiveArtwork | null>(null);
  const [artReady, setArtReady] = useState(false);
  const [transforms, setTransforms] = useState<Record<string, NormTransform>>(
    initialTransforms,
  );
  const [cupSrc, setCupSrc] = useState("");
  const [cupReady, setCupReady] = useState(false);
  const [fit, setFit] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [historyTick, setHistoryTick] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const etchRef = useRef<HTMLCanvasElement>(null);
  const artImageRef = useRef<HTMLImageElement | null>(null);
  const artworkUrlRef = useRef<string | null>(null);
  const undoRef = useRef<SessionSnapshot[]>([]);
  const redoRef = useRef<SessionSnapshot[]>([]);
  const dragRef = useRef<DragGesture | null>(null);
  const wheelRef = useRef<WheelBurst | null>(null);
  const dirtyRef = useRef(false);
  const mountedRef = useRef(true);
  const slugRef = useRef(customization.slug);
  const phaseRef = useRef<Phase>(phase);
  const sessionRef = useRef<SessionSnapshot>({
    variantId,
    areaId,
    artwork: null,
    transforms,
  });
  const transformRef = useRef<NormTransform>(transforms[areaId] ?? defaultTransform());
  const areaIdRef = useRef(areaId);
  const variant =
    customization.variants.find((item) => item.id === variantId) ??
    customization.variants[0];
  const area =
    customization.areas.find((item) => item.id === areaId) ?? customization.areas[0];
  const transform = transforms[area.id] ?? defaultTransform();

  slugRef.current = customization.slug;
  phaseRef.current = phase;

  const undoDepth = undoRef.current.length;
  const redoDepth = redoRef.current.length;
  const ready = phase === "ready";
  const showChoice = phase !== "loading";

  function cloneSession(): SessionSnapshot {
    const current = sessionRef.current;
    return {
      variantId: current.variantId,
      areaId: current.areaId,
      artwork: current.artwork,
      transforms: cloneTransforms(current.transforms),
    };
  }

  function persistCurrent() {
    if (phaseRef.current !== "ready") return;
    const snap = cloneSession();
    dirtyRef.current = false;
    writeCustomizationSession(
      {
        slug: slugRef.current,
        variantId: snap.variantId,
        areaId: snap.areaId,
        artwork: snap.artwork,
        transforms: snap.transforms,
      },
      (notice) => {
        if (notice === "not-saved") dirtyRef.current = true;
        if (notice === "saved") dirtyRef.current = false;
        if (!mountedRef.current) return;
        setSaveStatus(
          notice === "saving" ? "saving" : notice === "saved" ? "saved" : "not-saved",
        );
      },
    );
  }

  function pushHistory(before: SessionSnapshot) {
    undoRef.current = [...undoRef.current, before];
    redoRef.current = [];
    setHistoryTick((value) => value + 1);
  }

  function adoptArtwork(blob: Blob | null): LiveArtwork | null {
    if (blob && blob === sessionRef.current.artwork && artworkUrlRef.current) {
      return { blob, url: artworkUrlRef.current };
    }
    if (artworkUrlRef.current) {
      URL.revokeObjectURL(artworkUrlRef.current);
      artworkUrlRef.current = null;
    }
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    artworkUrlRef.current = url;
    return { blob, url };
  }

  function publishSession(next: SessionSnapshot, live: LiveArtwork | null) {
    const nextTransforms = cloneTransforms(next.transforms);
    sessionRef.current = {
      variantId: next.variantId,
      areaId: next.areaId,
      artwork: next.artwork,
      transforms: nextTransforms,
    };
    areaIdRef.current = next.areaId;
    transformRef.current = nextTransforms[next.areaId] ?? defaultTransform();
    setVariantId(next.variantId);
    setAreaId(next.areaId);
    setTransforms(nextTransforms);
    setArtwork(live);
  }

  function commitAreaTransform(targetArea: string, next: NormTransform) {
    const nextTransforms = {
      ...sessionRef.current.transforms,
      [targetArea]: next,
    };
    sessionRef.current = { ...sessionRef.current, transforms: nextTransforms };
    if (areaIdRef.current === targetArea) transformRef.current = next;
    setTransforms(nextTransforms);
    dirtyRef.current = true;
  }

  function commitDrag() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!sameSnapshot(drag.before, sessionRef.current)) {
      pushHistory(drag.before);
      persistCurrent();
    }
  }

  function flushWheelBurst() {
    const pending = wheelRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timer);
    wheelRef.current = null;
    if (!sameSnapshot(pending.before, sessionRef.current)) {
      pushHistory(pending.before);
      persistCurrent();
    }
  }

  function finishGesture() {
    commitDrag();
    flushWheelBurst();
  }

  function applySnapshot(next: SessionSnapshot) {
    const live = adoptArtwork(next.artwork);
    publishSession(next, live);
    dirtyRef.current = true;
  }

  useEffect(() => {
    let cancelled = false;
    readCustomizationSession(customization.slug)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setPhase("empty");
          return;
        }
        const nextTransforms = Object.fromEntries(
          customization.areas.map((item) => [
            item.id,
            record.transforms[item.id] ?? defaultTransform(),
          ]),
        );
        const nextVariantId = customization.variants.some(
          (item) => item.id === record.variantId,
        )
          ? record.variantId
          : defaultVariantId(customization);
        const nextAreaId = customization.areas.some((item) => item.id === record.areaId)
          ? record.areaId
          : customization.areas[0].id;
        const next: SessionSnapshot = {
          variantId: nextVariantId,
          areaId: nextAreaId,
          artwork: record.artwork,
          transforms: nextTransforms,
        };
        const live = adoptArtwork(next.artwork);
        if (cancelled) {
          if (live?.url) URL.revokeObjectURL(live.url);
          return;
        }
        publishSession(next, live);
        setPhase("restored");
      })
      .catch(() => {
        if (cancelled) return;
        setSaveStatus("session-not-saved");
        setPhase("empty");
      });
    return () => {
      cancelled = true;
    };
    // Hydrate once for this product. The sidecar object is the stable catalog record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customization.slug]);

  useEffect(() => {
    if (phase === "restored" || phase === "empty") setPhase("ready");
  }, [phase]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (wheelRef.current) {
        window.clearTimeout(wheelRef.current.timer);
        wheelRef.current = null;
      }
      if (dirtyRef.current && phaseRef.current === "ready") {
        const snap = cloneSession();
        dirtyRef.current = false;
        writeCustomizationSession(
          {
            slug: slugRef.current,
            variantId: snap.variantId,
            areaId: snap.areaId,
            artwork: snap.artwork,
            transforms: snap.transforms,
          },
          () => undefined,
        );
      }
      if (artworkUrlRef.current) {
        URL.revokeObjectURL(artworkUrlRef.current);
        artworkUrlRef.current = null;
      }
    };
    // The saved Blob outlives this object URL. Revoke the handle on unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showChoice) return;
    let cancelled = false;
    setCupReady(false);
    if (variant.code === "ORG") {
      setCupSrc(area.image);
      setCupReady(true);
      return;
    }
    loadImage(area.image)
      .then((img) => {
        if (cancelled) return;
        setCupSrc(recolorBody(img, area.imageWidth, area.imageHeight, variant.swatch));
        setCupReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCupSrc(area.image);
        setCupReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [showChoice, area, variant]);

  const paintEtch = useCallback(() => {
    const canvas = etchRef.current;
    const print = printRef.current;
    const image = artImageRef.current;
    if (!canvas || !print) return;
    const rect = print.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!image || !artwork) return;

    const naturalWidth = image.naturalWidth || 512;
    const naturalHeight = image.naturalHeight || 512;
    const contain = Math.min(width / naturalWidth, height / naturalHeight);
    const dw = naturalWidth * contain * transform.scale;
    const dh = naturalHeight * contain * transform.scale;
    const x = transform.xNorm * rect.width;
    const y = transform.yNorm * rect.height;
    const dx = (width - dw) / 2 + x * dpr;
    const dy = (height - dh) / 2 + y * dpr;

    const scratch = document.createElement("canvas");
    scratch.width = Math.max(1, Math.ceil(dw));
    scratch.height = Math.max(1, Math.ceil(dh));
    const sctx = scratch.getContext("2d");
    if (!sctx) return;
    sctx.drawImage(image, 0, 0, scratch.width, scratch.height);
    const frame = sctx.getImageData(0, 0, scratch.width, scratch.height);
    const data = frame.data;
    let transparent = false;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) {
        transparent = true;
        break;
      }
    }
    for (let i = 0; i < data.length; i += 4) {
      const lum =
        (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const alpha = data[i + 3] / 255;
      const etch = transparent ? alpha : (1 - lum) * alpha;
      data[i] = ETCH.r;
      data[i + 1] = ETCH.g;
      data[i + 2] = ETCH.b;
      data[i + 3] = Math.round(Math.max(0, Math.min(1, etch)) * 255);
    }
    sctx.putImageData(frame, 0, 0);
    ctx.drawImage(scratch, dx, dy);
  }, [artwork, transform.scale, transform.xNorm, transform.yNorm]);

  useEffect(() => {
    if (!artwork) {
      artImageRef.current = null;
      setArtReady(false);
      paintEtch();
      return;
    }
    let cancelled = false;
    setArtReady(false);
    loadImage(artwork.url)
      .then((img) => {
        if (cancelled) return;
        artImageRef.current = img;
        setArtReady(true);
        paintEtch();
      })
      .catch(() => {
        if (cancelled) return;
        artImageRef.current = null;
        setArtReady(false);
        paintEtch();
      });
    return () => {
      cancelled = true;
    };
  }, [artwork, paintEtch]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const aspect = area.imageWidth / area.imageHeight;
      const boxAspect = rect.width / rect.height;
      if (boxAspect > aspect) {
        const h = rect.height;
        const w = h * aspect;
        setFit({ x: (rect.width - w) / 2, y: 0, w, h });
      } else {
        const w = rect.width;
        const h = w / aspect;
        setFit({ x: 0, y: (rect.height - h) / 2, w, h });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [area.imageWidth, area.imageHeight]);

  useEffect(() => {
    if (!ready) return;
    const print = printRef.current;
    if (!print) return;
    const observer = new ResizeObserver(() => paintEtch());
    observer.observe(print);
    return () => observer.disconnect();
  }, [ready, paintEtch]);

  useEffect(() => {
    if (!ready) return;
    const print = printRef.current;
    if (!print) return;
    const onNativeWheel = (event: WheelEvent) => {
      const image = artImageRef.current;
      if (!image) return;
      event.preventDefault();
      event.stopPropagation();
      const box = print.getBoundingClientRect();
      if (!wheelRef.current) {
        wheelRef.current = { before: cloneSession(), timer: 0 };
      }
      const current = transformRef.current;
      const pixels = screenOffset(current, box);
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      const clamped = clampTransform(
        { scale: current.scale * factor, x: pixels.x, y: pixels.y },
        box,
        image,
      );
      const next = toNorm(clamped.scale, clamped.x, clamped.y, box);
      if (!next) return;
      commitAreaTransform(areaIdRef.current, next);
      if (
        redoRef.current.length > 0 &&
        !sameSnapshot(wheelRef.current.before, sessionRef.current)
      ) {
        redoRef.current = [];
        setHistoryTick((value) => value + 1);
      }
      window.clearTimeout(wheelRef.current.timer);
      wheelRef.current.timer = window.setTimeout(() => {
        flushWheelBurst();
      }, WHEEL_BURST_MS);
    };
    print.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      print.removeEventListener("wheel", onNativeWheel);
    };
    // The listener reads live refs. Rebinding on every transform would split one burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, area.id]);

  function selectVariant(id: string) {
    if (phaseRef.current !== "ready" || sessionRef.current.variantId === id) return;
    finishGesture();
    const before = cloneSession();
    sessionRef.current = { ...sessionRef.current, variantId: id };
    setVariantId(id);
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent();
  }

  function selectArea(id: string) {
    if (phaseRef.current !== "ready" || sessionRef.current.areaId === id) return;
    finishGesture();
    const before = cloneSession();
    const nextTransform = sessionRef.current.transforms[id] ?? defaultTransform();
    sessionRef.current = { ...sessionRef.current, areaId: id };
    areaIdRef.current = id;
    transformRef.current = nextTransform;
    setAreaId(id);
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent();
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (phaseRef.current !== "ready" || !sessionRef.current.artwork) return;
    flushWheelBurst();
    event.stopPropagation();
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Capture is unavailable once the pointer has already ended. */
    }
    const box = event.currentTarget.getBoundingClientRect();
    const origin = screenOffset(transformRef.current, box);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      before: cloneSession(),
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const print = printRef.current;
    const image = artImageRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !print || !image) return;
    event.stopPropagation();
    const box = print.getBoundingClientRect();
    const clamped = clampTransform(
      {
        scale: transformRef.current.scale,
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      },
      box,
      image,
    );
    const next = toNorm(clamped.scale, clamped.x, clamped.y, box);
    if (!next) return;
    commitAreaTransform(areaIdRef.current, next);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    commitDrag();
  }

  function nudgeScale(factor: number) {
    if (phaseRef.current !== "ready") return;
    finishGesture();
    const print = printRef.current;
    const image = artImageRef.current;
    if (!print || !image) return;
    const box = print.getBoundingClientRect();
    const current = transformRef.current;
    const pixels = screenOffset(current, box);
    const clamped = clampTransform(
      { scale: current.scale * factor, x: pixels.x, y: pixels.y },
      box,
      image,
    );
    const next = toNorm(clamped.scale, clamped.x, clamped.y, box);
    if (!next || sameTransform(current, next)) return;
    const before = cloneSession();
    commitAreaTransform(areaIdRef.current, next);
    pushHistory(before);
    persistCurrent();
  }

  function resetTransform() {
    if (phaseRef.current !== "ready") return;
    finishGesture();
    const targetArea = areaIdRef.current;
    const current = sessionRef.current.transforms[targetArea] ?? defaultTransform();
    if (sameTransform(current, defaultTransform())) return;
    const before = cloneSession();
    commitAreaTransform(targetArea, defaultTransform());
    pushHistory(before);
    persistCurrent();
  }

  function onFile(file: File | undefined) {
    if (phaseRef.current !== "ready" || !file || !acceptedFile(file)) return;
    finishGesture();
    const before = cloneSession();
    const targetArea = areaIdRef.current;
    const live = adoptArtwork(file);
    const nextTransforms = {
      ...sessionRef.current.transforms,
      [targetArea]: defaultTransform(),
    };
    sessionRef.current = {
      ...sessionRef.current,
      artwork: file,
      transforms: nextTransforms,
    };
    transformRef.current = defaultTransform();
    setArtwork(live);
    setTransforms(nextTransforms);
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent();
  }

  function undo() {
    if (phaseRef.current !== "ready") return;
    finishGesture();
    const stack = undoRef.current;
    if (stack.length === 0) return;
    const previous = stack[stack.length - 1];
    undoRef.current = stack.slice(0, -1);
    redoRef.current = [...redoRef.current, cloneSession()];
    applySnapshot(previous);
    setHistoryTick((value) => value + 1);
    persistCurrent();
  }

  function redo() {
    if (phaseRef.current !== "ready") return;
    finishGesture();
    const stack = redoRef.current;
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    redoRef.current = stack.slice(0, -1);
    undoRef.current = [...undoRef.current, cloneSession()];
    applySnapshot(next);
    setHistoryTick((value) => value + 1);
    persistCurrent();
  }

  const api: CustomizerApi = {
    customization,
    phase,
    ready,
    showChoice,
    saveStatus,
    variantId,
    areaId,
    artwork,
    artReady,
    cupSrc,
    cupReady,
    area,
    variant,
    transforms,
    undoDepth,
    redoDepth,
    canUndo: ready && undoDepth > 0,
    canRedo: ready && redoDepth > 0,
    historyTick,
    selectVariant,
    selectArea,
    printRef,
    etchRef,
    stageRef,
    fit,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    nudgeScale,
    resetTransform,
    undo,
    redo,
    onFile,
  };

  return (
    <CustomizerContext.Provider value={api}>{children}</CustomizerContext.Provider>
  );
}

export function CustomizerHero() {
  const api = useCustomizer();
  const { area, fit, cupSrc, cupReady, showChoice } = api;
  return (
    <div ref={api.stageRef} className="featured-discovery__hero-media customizer__stage">
      {showChoice && cupReady ? (
        <img
          src={cupSrc}
          alt=""
          className="customizer__cup"
          draggable={false}
          style={{
            left: fit.x,
            top: fit.y,
            width: fit.w,
            height: fit.h,
          }}
        />
      ) : null}
      {showChoice ? (
        <div
          ref={api.printRef}
          className="customizer__print"
          data-customizer-print
          style={{
            left: fit.x + area.placement.x * fit.w,
            top: fit.y + area.placement.y * fit.h,
            width: area.placement.width * fit.w,
            height: area.placement.height * fit.h,
          }}
          onPointerDown={api.onPointerDown}
          onPointerMove={api.onPointerMove}
          onPointerUp={api.onPointerUp}
          onPointerCancel={api.onPointerUp}
        >
          <canvas ref={api.etchRef} className="customizer__etch" />
        </div>
      ) : null}
    </div>
  );
}

export function CustomizerControls() {
  const api = useCustomizer();
  const { customization, variant, area, artwork, transforms, showChoice } = api;
  const side1 = transforms["side-1"] ?? defaultTransform();
  const side2 = transforms["side-2"] ?? defaultTransform();
  const statusText =
    api.saveStatus === "saving"
      ? "Saving…"
      : api.saveStatus === "saved"
        ? "Saved"
        : api.saveStatus === "not-saved"
          ? "Not saved"
          : api.saveStatus === "session-not-saved"
            ? "Session not saved"
            : "";
  return (
    <div
      className="customizer__controls"
      data-customizer-controls
      data-phase={api.phase}
      data-save-status={api.saveStatus}
      data-variant-id={api.variantId}
      data-area-id={api.areaId}
      data-has-art={artwork ? "true" : "false"}
      data-art-ready={api.artReady ? "true" : "false"}
      data-can-undo={api.canUndo ? "true" : "false"}
      data-can-redo={api.canRedo ? "true" : "false"}
      data-undo-depth={api.undoDepth}
      data-redo-depth={api.redoDepth}
      data-history={api.historyTick}
      data-side1-scale={side1.scale}
      data-side1-x={side1.xNorm}
      data-side1-y={side1.yNorm}
      data-side2-scale={side2.scale}
      data-side2-x={side2.xNorm}
      data-side2-y={side2.yNorm}
    >
      <div className="customizer__row" role="listbox" aria-label="Bottle color">
        {customization.variants.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={showChoice && item.id === variant.id}
            aria-label={item.name}
            className={`customizer__swatch${showChoice && item.id === variant.id ? " customizer__swatch--selected" : ""}`}
            style={{ backgroundColor: item.swatch }}
            disabled={!api.ready}
            onClick={() => api.selectVariant(item.id)}
          />
        ))}
      </div>
      <div className="customizer__row" role="tablist" aria-label="Imprint side">
        {customization.areas.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={showChoice && item.id === area.id}
            className={`customizer__side${showChoice && item.id === area.id ? " customizer__side--selected" : ""}`}
            disabled={!api.ready}
            onClick={() => api.selectArea(item.id)}
          >
            {item.id === "side-1" ? "Side 1" : "Side 2"}
          </button>
        ))}
      </div>
      <div className="customizer__row">
        <label className="customizer__upload">
          Upload
          <input
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg,image/svg+xml,.svg"
            disabled={!api.ready}
            onChange={(event) => {
              api.onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="customizer__tool"
          onClick={() => api.nudgeScale(0.92)}
          disabled={!api.ready || !artwork}
        >
          −
        </button>
        <button
          type="button"
          className="customizer__tool"
          onClick={() => api.nudgeScale(1.08)}
          disabled={!api.ready || !artwork}
        >
          +
        </button>
        <button
          type="button"
          className="customizer__tool"
          onClick={() => api.resetTransform()}
          disabled={!api.ready || !artwork}
        >
          Reset
        </button>
        <button
          type="button"
          className="customizer__tool"
          onClick={() => api.undo()}
          disabled={!api.canUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="customizer__tool"
          onClick={() => api.redo()}
          disabled={!api.canRedo}
        >
          Redo
        </button>
      </div>
      {statusText ? (
        <p className="customizer__status" role="status" aria-live="polite">
          {statusText}
        </p>
      ) : null}
      <p className="customizer__note">{PREVIEW_DISCLAIMER}</p>
    </div>
  );
}
