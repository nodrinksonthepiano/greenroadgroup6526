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
import Image from "next/image";
import type { ProductCustomization } from "@/data/customization";
import {
  deleteArtworkAsset,
  readCustomizationBundle,
  sessionsReferencingAsset,
  writeCustomizationSession,
  type ArtworkAsset,
  type NormTransform,
} from "./sessionStore";

export const PREVIEW_DISCLAIMER =
  "Preview only · supplier proof required before production";

const BASE_BODY = { r: 254, g: 141, b: 47 };
const BASE_LUM =
  0.299 * BASE_BODY.r + 0.587 * BASE_BODY.g + 0.114 * BASE_BODY.b;
const ETCH = { r: 236, g: 236, b: 232 };
const WHEEL_BURST_MS = 300;
const NORM_EPSILON = 1e-6;

type Phase = "loading" | "restored" | "empty" | "ready";
type SaveStatus = "idle" | "saving" | "saved" | "not-saved" | "session-not-saved";
type LiveArtwork = { blob: Blob; url: string };
type EditGroup = "placement" | "size" | "treatment";
type SessionSnapshot = {
  variantId: string;
  areaId: string;
  assetId: string | null;
  colorChosen: boolean;
  removeBackground: boolean;
  invert: boolean;
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

function isNearWhite(r: number, g: number, b: number, a: number): boolean {
  if (a < 200) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum >= 0.88 && sat <= 0.14;
}

/** Near-white pixels that touch the image edge. Interior whites stay. */
function edgeConnectedNearWhite(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const background = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (background[pixel]) return;
    const offset = pixel * 4;
    if (!isNearWhite(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
      return;
    }
    background[pixel] = 1;
    stack.push(pixel);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length > 0) {
    const pixel = stack.pop();
    if (pixel === undefined) break;
    const x = pixel % width;
    const y = (pixel - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return background;
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
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
}

function defaultTransform(): NormTransform {
  return { scale: 1, xNorm: 0, yNorm: 0 };
}

function defaultVariantId(customization: ProductCustomization): string {
  const code = customization.baseVariantCode;
  if (code) {
    const match = customization.variants.find((item) => item.code === code);
    if (match) return match.id;
  }
  return customization.variants[0].id;
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
  if (
    a.variantId !== b.variantId ||
    a.areaId !== b.areaId ||
    a.assetId !== b.assetId ||
    a.colorChosen !== b.colorChosen ||
    a.removeBackground !== b.removeBackground ||
    a.invert !== b.invert
  ) {
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
  assetId: string | null;
  artwork: LiveArtwork | null;
  assets: ArtworkAsset[];
  assetUrls: Record<string, string>;
  showDesign: boolean;
  showCup: boolean;
  colorChosen: boolean;
  editing: boolean;
  editGroup: EditGroup;
  removeBackground: boolean;
  invert: boolean;
  heroImage: string;
  heroAlt: string;
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
  toggleEditing: () => void;
  openEditing: () => void;
  setEditGroup: (group: EditGroup) => void;
  toggleRemoveBackground: () => void;
  toggleInvert: () => void;
  deleteAsset: (id: string) => void;
  printRef: React.RefObject<HTMLDivElement | null>;
  etchRef: React.RefObject<HTMLCanvasElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  fit: { x: number; y: number; w: number; h: number };
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  nudgeScale: (factor: number) => void;
  nudgePosition: (dx: number, dy: number) => void;
  resetTransform: () => void;
  undo: () => void;
  redo: () => void;
  onFile: (file: File | undefined) => void;
  selectAsset: (id: string) => void;
  removeArtwork: () => void;
};

const CustomizerContext = createContext<CustomizerApi | null>(null);

function useCustomizer(): CustomizerApi {
  const value = useContext(CustomizerContext);
  if (!value) throw new Error("Customizer is missing its provider");
  return value;
}

export function ProductCustomizer({
  customization,
  heroImage,
  heroAlt,
  children,
}: {
  customization: ProductCustomization;
  heroImage: string;
  heroAlt: string;
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
  const [assetId, setAssetId] = useState<string | null>(null);
  const [colorChosen, setColorChosen] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(
    customization.treatments.removeBackground.defaultOn,
  );
  const [invert, setInvert] = useState(customization.treatments.invert.defaultOn);
  const [editing, setEditing] = useState(false);
  const [editGroup, setEditGroup] = useState<EditGroup>("placement");
  const [assets, setAssets] = useState<ArtworkAsset[]>([]);
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
  const assetsRef = useRef<ArtworkAsset[]>([]);
  const urlMapRef = useRef<Map<string, string>>(new Map());
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
    assetId: null,
    colorChosen: false,
    removeBackground: customization.treatments.removeBackground.defaultOn,
    invert: customization.treatments.invert.defaultOn,
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
  const showDesign = showChoice && Boolean(artwork);
  const showCup = showChoice && (Boolean(artwork) || colorChosen);

  function cloneSession(): SessionSnapshot {
    const current = sessionRef.current;
    return {
      variantId: current.variantId,
      areaId: current.areaId,
      assetId: current.assetId,
      colorChosen: current.colorChosen,
      removeBackground: current.removeBackground,
      invert: current.invert,
      transforms: cloneTransforms(current.transforms),
    };
  }

  function persistCurrent(asset?: ArtworkAsset) {
    if (phaseRef.current !== "ready") return;
    const snap = cloneSession();
    dirtyRef.current = false;
    const applied =
      asset ?? assetsRef.current.find((item) => item.id === snap.assetId);
    writeCustomizationSession(
      {
        slug: slugRef.current,
        variantId: snap.variantId,
        areaId: snap.areaId,
        assetId: snap.assetId,
        colorChosen: snap.colorChosen,
        removeBackground: snap.removeBackground,
        invert: snap.invert,
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
      applied,
    );
  }

  function pushHistory(before: SessionSnapshot) {
    undoRef.current = [...undoRef.current, before];
    redoRef.current = [];
    setHistoryTick((value) => value + 1);
  }

  function urlFor(asset: ArtworkAsset): string {
    const existing = urlMapRef.current.get(asset.id);
    if (existing) return existing;
    const url = URL.createObjectURL(asset.blob);
    urlMapRef.current.set(asset.id, url);
    return url;
  }

  function liveFor(id: string | null): LiveArtwork | null {
    if (!id) return null;
    const asset = assetsRef.current.find((item) => item.id === id);
    if (!asset) return null;
    return { blob: asset.blob, url: urlFor(asset) };
  }

  function rememberAssets(nextAssets: ArtworkAsset[]) {
    assetsRef.current = nextAssets;
    setAssets(nextAssets);
    for (const asset of nextAssets) urlFor(asset);
  }

  function publishSession(next: SessionSnapshot) {
    const nextTransforms = cloneTransforms(next.transforms);
    const live = liveFor(next.assetId);
    sessionRef.current = {
      variantId: next.variantId,
      areaId: next.areaId,
      assetId: next.assetId,
      colorChosen: next.colorChosen,
      removeBackground: next.removeBackground,
      invert: next.invert,
      transforms: nextTransforms,
    };
    areaIdRef.current = next.areaId;
    transformRef.current = nextTransforms[next.areaId] ?? defaultTransform();
    setVariantId(next.variantId);
    setAreaId(next.areaId);
    setAssetId(next.assetId);
    setColorChosen(next.colorChosen);
    setRemoveBackground(next.removeBackground);
    setInvert(next.invert);
    setTransforms(nextTransforms);
    setArtwork((current) =>
      current?.blob === live?.blob && current?.url === live?.url ? current : live,
    );
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
    publishSession(next);
    dirtyRef.current = true;
  }

  useEffect(() => {
    let cancelled = false;
    readCustomizationBundle(customization.slug)
      .then((bundle) => {
        if (cancelled) return;
        rememberAssets(bundle.assets);
        if (!bundle.session) {
          setPhase("empty");
          return;
        }
        const record = bundle.session;
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
        const knownAsset = bundle.assets.some((item) => item.id === record.assetId);
        publishSession({
          variantId: nextVariantId,
          areaId: nextAreaId,
          assetId: knownAsset ? record.assetId : null,
          colorChosen:
            record.colorChosen || nextVariantId !== defaultVariantId(customization),
          removeBackground: record.removeBackground,
          invert: record.invert,
          transforms: nextTransforms,
        });
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
        const applied = assetsRef.current.find((item) => item.id === snap.assetId);
        writeCustomizationSession(
          {
            slug: slugRef.current,
            variantId: snap.variantId,
            areaId: snap.areaId,
            assetId: snap.assetId,
            colorChosen: snap.colorChosen,
            removeBackground: snap.removeBackground,
            invert: snap.invert,
            transforms: snap.transforms,
          },
          () => undefined,
          applied,
        );
      }
      for (const url of urlMapRef.current.values()) URL.revokeObjectURL(url);
      urlMapRef.current.clear();
    };
    // The saved Blob outlives this object URL. Revoke the handle on unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showChoice) return;
    let cancelled = false;
    setCupReady(false);
    const baseCode = customization.baseVariantCode;
    if (!baseCode || variant.code === baseCode) {
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
  }, [showChoice, area, variant, customization.baseVariantCode]);

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

    if (customization.decoration === "full-color") {
      ctx.drawImage(image, dx, dy, dw, dh);
      return;
    }

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
    const useRemove =
      customization.treatments.removeBackground.enabled && removeBackground;
    const useInvert = customization.treatments.invert.enabled && invert;
    const background =
      !transparent && useRemove
        ? edgeConnectedNearWhite(data, scratch.width, scratch.height)
        : null;
    const pixelCount = scratch.width * scratch.height;
    for (let pixel = 0; pixel < pixelCount; pixel += 1) {
      const i = pixel * 4;
      const lum =
        (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const alpha = data[i + 3] / 255;
      let etch = transparent
        ? alpha
        : background
          ? background[pixel]
            ? 0
            : alpha
          : (1 - lum) * alpha;
      if (useInvert) etch = 1 - etch;
      data[i] = ETCH.r;
      data[i + 1] = ETCH.g;
      data[i + 2] = ETCH.b;
      data[i + 3] = Math.round(Math.max(0, Math.min(1, etch)) * 255);
    }
    sctx.putImageData(frame, 0, 0);
    ctx.drawImage(scratch, dx, dy);
  }, [
    artwork,
    customization.decoration,
    customization.treatments,
    invert,
    removeBackground,
    transform.scale,
    transform.xNorm,
    transform.yNorm,
  ]);

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
    if (!ready || !showDesign) return;
    const print = printRef.current;
    if (!print) return;
    const observer = new ResizeObserver(() => paintEtch());
    observer.observe(print);
    return () => observer.disconnect();
  }, [ready, showDesign, paintEtch]);

  useEffect(() => {
    if (!ready || !showDesign) return;
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
  }, [ready, showDesign, area.id]);

  function selectVariant(id: string) {
    if (phaseRef.current !== "ready") return;
    const current = sessionRef.current;
    if (current.variantId === id && current.colorChosen) return;
    finishGesture();
    const before = cloneSession();
    publishSession({ ...current, variantId: id, colorChosen: true });
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
    if (phaseRef.current !== "ready" || !sessionRef.current.assetId) return;
    setEditing(true);
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

  function nudgePosition(dx: number, dy: number) {
    if (phaseRef.current !== "ready") return;
    finishGesture();
    const print = printRef.current;
    const image = artImageRef.current;
    if (!print || !image) return;
    const box = print.getBoundingClientRect();
    const current = transformRef.current;
    const pixels = screenOffset(current, box);
    const stepX = Math.max(1, box.width * 0.02);
    const stepY = Math.max(1, box.height * 0.02);
    const clamped = clampTransform(
      { scale: current.scale, x: pixels.x + dx * stepX, y: pixels.y + dy * stepY },
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
    const asset: ArtworkAsset = {
      id: crypto.randomUUID(),
      name: file.name || "artwork",
      type: file.type || "application/octet-stream",
      blob: file,
    };
    rememberAssets([...assetsRef.current, asset]);
    const targetArea = areaIdRef.current;
    publishSession({
      ...sessionRef.current,
      assetId: asset.id,
      transforms: {
        ...sessionRef.current.transforms,
        [targetArea]: defaultTransform(),
      },
    });
    transformRef.current = defaultTransform();
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent(asset);
  }

  function selectAsset(id: string) {
    if (phaseRef.current !== "ready" || sessionRef.current.assetId === id) return;
    if (!assetsRef.current.some((item) => item.id === id)) return;
    finishGesture();
    const before = cloneSession();
    const hadAsset = Boolean(sessionRef.current.assetId);
    const targetArea = areaIdRef.current;
    publishSession({
      ...sessionRef.current,
      assetId: id,
      transforms: hadAsset
        ? {
            ...sessionRef.current.transforms,
            [targetArea]: defaultTransform(),
          }
        : sessionRef.current.transforms,
    });
    if (hadAsset) transformRef.current = defaultTransform();
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent();
  }

  function removeArtwork() {
    if (phaseRef.current !== "ready" || !sessionRef.current.assetId) return;
    finishGesture();
    const before = cloneSession();
    publishSession({ ...sessionRef.current, assetId: null });
    setEditing(false);
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent();
  }

  function toggleTreatment(key: "removeBackground" | "invert") {
    if (!customization.treatments[key].enabled) return;
    if (phaseRef.current !== "ready" || !sessionRef.current.assetId) return;
    finishGesture();
    const before = cloneSession();
    publishSession({
      ...sessionRef.current,
      [key]: !sessionRef.current[key],
    });
    dirtyRef.current = true;
    pushHistory(before);
    persistCurrent();
  }

  function deleteAsset(id: string) {
    if (phaseRef.current !== "ready") return;
    if (!assetsRef.current.some((item) => item.id === id)) return;
    finishGesture();
    const localHit = sessionRef.current.assetId === id;
    void sessionsReferencingAsset(id)
      .then((slugs) => {
        if (!mountedRef.current || phaseRef.current !== "ready") return;
        const referenced = new Set(slugs);
        if (localHit) referenced.add(slugRef.current);
        if (
          referenced.size > 0 &&
          !window.confirm(
            "Delete this artwork? It will also be removed from products currently using it.",
          )
        ) {
          return;
        }
        const scrub = (snap: SessionSnapshot): SessionSnapshot =>
          snap.assetId === id ? { ...snap, assetId: null } : snap;
        undoRef.current = undoRef.current.map(scrub);
        redoRef.current = redoRef.current.map(scrub);
        const url = urlMapRef.current.get(id);
        urlMapRef.current.delete(id);
        rememberAssets(assetsRef.current.filter((item) => item.id !== id));
        if (sessionRef.current.assetId === id) {
          publishSession({ ...sessionRef.current, assetId: null });
          setEditing(false);
        }
        if (url) requestAnimationFrame(() => URL.revokeObjectURL(url));
        dirtyRef.current = false;
        deleteArtworkAsset(id, (notice) => {
          if (notice === "not-saved") dirtyRef.current = true;
          if (!mountedRef.current) return;
          setSaveStatus(
            notice === "saving" ? "saving" : notice === "saved" ? "saved" : "not-saved",
          );
        });
        setHistoryTick((value) => value + 1);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setSaveStatus("not-saved");
      });
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
    assetId,
    artwork,
    assets,
    assetUrls: Object.fromEntries(assets.map((item) => [item.id, urlFor(item)])),
    showDesign,
    showCup,
    colorChosen,
    editing,
    editGroup,
    removeBackground,
    invert,
    heroImage,
    heroAlt,
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
    toggleEditing: () => setEditing((open) => !open),
    openEditing: () => setEditing(true),
    setEditGroup,
    toggleRemoveBackground: () => toggleTreatment("removeBackground"),
    toggleInvert: () => toggleTreatment("invert"),
    deleteAsset,
    printRef,
    etchRef,
    stageRef,
    fit,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    nudgeScale,
    nudgePosition,
    resetTransform,
    undo,
    redo,
    onFile,
    selectAsset,
    removeArtwork,
  };

  useEffect(() => {
    if (!artwork) setEditing(false);
  }, [artwork]);

  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      const anchor = printRef.current?.parentElement;
      if (target instanceof Node && anchor?.contains(target)) return;
      setEditing(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [editing]);

  return (
    <CustomizerContext.Provider value={api}>{children}</CustomizerContext.Provider>
  );
}

export function CustomizerHero() {
  const api = useCustomizer();
  const { area, fit, cupSrc, cupReady, showCup, showDesign, heroImage, heroAlt } = api;
  return (
    <div
      ref={api.stageRef}
      className="featured-discovery__hero-media customizer__stage"
      data-editing={api.editing ? "true" : "false"}
    >
      {!showCup && heroImage ? (
        <Image
          src={heroImage}
          alt={heroAlt}
          fill
          sizes="(max-width: 640px) 300px, 360px"
          className="featured-discovery__hero-img"
          priority
        />
      ) : null}
      {showCup && cupReady ? (
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
      {showDesign && api.customization.previewLabel ? (
        <p className="customizer__preview-label">{api.customization.previewLabel}</p>
      ) : null}
      {showDesign ? (
        <div
          className="customizer__print-anchor"
          style={{
            left: fit.x + area.placement.x * fit.w,
            top: fit.y + area.placement.y * fit.h,
            width: area.placement.width * fit.w,
            height: area.placement.height * fit.h,
          }}
        >
          {api.editing ? (
            <button
              type="button"
              className="customizer__micro customizer__micro--up"
              aria-label="Move up"
              onClick={() => api.nudgePosition(0, -1)}
              disabled={!api.ready}
            >
              ↑
            </button>
          ) : null}
          {api.editing ? (
            <button
              type="button"
              className="customizer__micro customizer__micro--left"
              aria-label="Move left"
              onClick={() => api.nudgePosition(-1, 0)}
              disabled={!api.ready}
            >
              ←
            </button>
          ) : null}
          <div
            ref={api.printRef}
            className="customizer__print"
            data-customizer-print
            onPointerDown={api.onPointerDown}
            onPointerMove={api.onPointerMove}
            onPointerUp={api.onPointerUp}
            onPointerCancel={api.onPointerUp}
          >
            <canvas ref={api.etchRef} className="customizer__etch" />
          </div>
          {api.editing ? (
            <button
              type="button"
              className="customizer__micro customizer__micro--right"
              aria-label="Move right"
              onClick={() => api.nudgePosition(1, 0)}
              disabled={!api.ready}
            >
              →
            </button>
          ) : null}
          {api.editing ? (
            <button
              type="button"
              className="customizer__micro customizer__micro--down"
              aria-label="Move down"
              onClick={() => api.nudgePosition(0, 1)}
              disabled={!api.ready}
            >
              ↓
            </button>
          ) : null}
          {!api.editing ? (
            <button
              type="button"
              className="customizer__place"
              aria-label="Edit artwork placement"
              disabled={!api.ready}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => api.openEditing()}
            >
              <span className="customizer__place-mark">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 4H6.2A2.2 2.2 0 0 0 4 6.2V9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 4h2.8A2.2 2.2 0 0 1 20 6.2V9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 15v2.8a2.2 2.2 0 0 1-2.2 2.2H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 20H6.2A2.2 2.2 0 0 1 4 17.8V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>
          ) : null}
          {api.editing ? (
            <div className="customizer__micro-zoom" aria-label="Scale artwork">
              <button
                type="button"
                className="customizer__micro"
                aria-label="Larger"
                onClick={() => api.nudgeScale(1.08)}
                disabled={!api.ready}
              >
                +
              </button>
              <button
                type="button"
                className="customizer__micro"
                aria-label="Smaller"
                onClick={() => api.nudgeScale(0.92)}
                disabled={!api.ready}
              >
                −
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CustomizerColorControls() {
  const api = useCustomizer();
  const { customization, variant } = api;
  return (
    <div className="customizer__color-strip">
      <div className="customizer__row customizer__row--swatches" role="listbox" aria-label={customization.colorLabel}>
        {customization.variants.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={item.id === variant.id}
            aria-label={item.name}
            className={`customizer__swatch${item.id === variant.id ? " customizer__swatch--selected" : ""}`}
            style={{ backgroundColor: item.swatch }}
            disabled={!api.ready}
            onClick={() => api.selectVariant(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function CustomizerControls() {
  const api = useCustomizer();
  const { customization, area, artwork, transforms, showDesign, assets, assetUrls } = api;
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
  const artworkPanel = (
    <div className="customizer__section customizer__section--artwork">
      <p className="customizer__group">{artwork ? "Your artwork" : "Add your logo"}</p>
      <div className="customizer__row customizer__row--assets" role="listbox" aria-label={artwork ? "Your artwork" : "Add your logo"}>
        {assets.map((item) => (
          <span key={item.id} className="customizer__thumb-wrap">
            <button
              type="button"
              className={`customizer__thumb${artwork && api.assetId === item.id ? " customizer__thumb--selected" : ""}`}
              aria-label={item.name}
              aria-pressed={Boolean(artwork) && api.assetId === item.id}
              disabled={!api.ready}
              onClick={() => api.selectAsset(item.id)}
            >
              <img src={assetUrls[item.id]} alt="" />
            </button>
            <button
              type="button"
              className="customizer__thumb-delete"
              aria-label={`Delete ${item.name} from artwork`}
              disabled={!api.ready}
              onClick={() => api.deleteAsset(item.id)}
            >
              ×
            </button>
          </span>
        ))}
        <label className="customizer__upload">
          {artwork ? "Add another" : "Upload"}
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
      </div>
      {artwork ? (
        <div className="customizer__artwork-options">
          <div
            className="customizer__row customizer__row--side"
            role="tablist"
            aria-label="Artwork placement"
            style={
              customization.areas.length === 2
                ? undefined
                : {
                    gridTemplateColumns: `repeat(${customization.areas.length}, minmax(0, 1fr))`,
                  }
            }
          >
            {customization.areas.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === area.id}
                className={`customizer__side${item.id === area.id ? " customizer__side--selected" : ""}`}
                disabled={!api.ready}
                onClick={() => api.selectArea(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {customization.treatments.removeBackground.enabled ||
          customization.treatments.invert.enabled ? (
            <div className="customizer__row customizer__row--treatment">
              {customization.treatments.removeBackground.enabled ? (
                <button
                  type="button"
                  className={`customizer__tool${api.removeBackground ? " customizer__side--selected" : ""}`}
                  aria-pressed={api.removeBackground}
                  onClick={() => api.toggleRemoveBackground()}
                >
                  Remove background
                </button>
              ) : null}
              {customization.treatments.invert.enabled ? (
                <button
                  type="button"
                  className={`customizer__tool${api.invert ? " customizer__side--selected" : ""}`}
                  aria-pressed={api.invert}
                  onClick={() => api.toggleInvert()}
                >
                  Invert
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  return (
    <div
      className="customizer__controls"
      data-customizer-controls
      data-phase={api.phase}
      data-save-status={api.saveStatus}
      data-variant-id={api.variantId}
      data-area-id={api.areaId}
      data-has-art={artwork ? "true" : "false"}
      data-show-design={showDesign ? "true" : "false"}
      data-show-cup={api.showCup ? "true" : "false"}
      data-color-chosen={api.colorChosen ? "true" : "false"}
      data-editing={api.editing ? "true" : "false"}
      data-edit-group={api.editGroup}
      data-remove-background={api.removeBackground ? "true" : "false"}
      data-invert={api.invert ? "true" : "false"}
      data-asset-count={assets.length}
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
      {artwork ? (
        <>
          {artworkPanel}
          <div className="customizer__row customizer__row--utility">
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
            <button
              type="button"
              className="customizer__tool"
              onClick={() => api.resetTransform()}
              disabled={!api.ready || !artwork}
            >
              Reset
            </button>
          </div>
          <div className="customizer__section customizer__section--remove">
            <button
              type="button"
              className="customizer__tool customizer__tool--remove"
              onClick={() => api.removeArtwork()}
            >
              {customization.removeLabel}
            </button>
          </div>
          <p className="customizer__note">{PREVIEW_DISCLAIMER}</p>
        </>
      ) : (
        <>
          {artworkPanel}
        </>
      )}
      {statusText ? (
        <p className="customizer__status" role="status" aria-live="polite">
          {statusText}
        </p>
      ) : null}
    </div>
  );
}
