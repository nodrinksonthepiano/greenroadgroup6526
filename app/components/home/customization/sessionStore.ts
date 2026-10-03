export const CUSTOMIZATION_DB_NAME = "greenroad-customization";
export const CUSTOMIZATION_STORE = "sessions";

const DB_VERSION = 1;

export type NormTransform = {
  scale: number;
  xNorm: number;
  yNorm: number;
};

export type CustomizationSession = {
  slug: string;
  variantId: string;
  areaId: string;
  artwork: Blob | null;
  transforms: Record<string, NormTransform>;
};

export type SaveNotice = "saving" | "saved" | "not-saved";

let databasePromise: Promise<IDBDatabase> | null = null;
let writeChain: Promise<void> = Promise.resolve();
let writeRevision = 0;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CUSTOMIZATION_DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CUSTOMIZATION_STORE)) {
          db.createObjectStore(CUSTOMIZATION_STORE, { keyPath: "slug" });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          databasePromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        databasePromise = null;
        reject(request.error ?? new Error("Could not open customization session"));
      };
    });
  }
  return databasePromise;
}

function isNorm(value: unknown): value is NormTransform {
  if (!value || typeof value !== "object") return false;
  const item = value as NormTransform;
  return (
    Number.isFinite(item.scale) &&
    item.scale > 0 &&
    Number.isFinite(item.xNorm) &&
    Number.isFinite(item.yNorm)
  );
}

function readRecord(value: unknown): CustomizationSession | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<CustomizationSession>;
  if (typeof record.slug !== "string") return null;
  if (typeof record.variantId !== "string" || typeof record.areaId !== "string") {
    return null;
  }
  if (!record.transforms || typeof record.transforms !== "object") return null;
  const transforms: Record<string, NormTransform> = {};
  for (const [id, transform] of Object.entries(record.transforms)) {
    if (isNorm(transform)) transforms[id] = { ...transform };
  }
  return {
    slug: record.slug,
    variantId: record.variantId,
    areaId: record.areaId,
    artwork: record.artwork instanceof Blob ? record.artwork : null,
    transforms,
  };
}

function snapshotRecord(record: CustomizationSession): CustomizationSession {
  const transforms: Record<string, NormTransform> = {};
  for (const [id, value] of Object.entries(record.transforms)) {
    transforms[id] = {
      scale: value.scale,
      xNorm: value.xNorm,
      yNorm: value.yNorm,
    };
  }
  return {
    slug: record.slug,
    variantId: record.variantId,
    areaId: record.areaId,
    artwork: record.artwork,
    transforms,
  };
}

function notify(onNotice: (notice: SaveNotice) => void, notice: SaveNotice) {
  try {
    onNotice(notice);
  } catch {
    /* The card can unmount while a write finishes. */
  }
}

export function readCustomizationSession(
  slug: string,
): Promise<CustomizationSession | null> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db
          .transaction(CUSTOMIZATION_STORE, "readonly")
          .objectStore(CUSTOMIZATION_STORE)
          .get(slug);
        request.onsuccess = () => resolve(readRecord(request.result));
        request.onerror = () =>
          reject(request.error ?? new Error("Could not read customization session"));
      }),
  );
}

export function writeCustomizationSession(
  record: CustomizationSession,
  onNotice: (notice: SaveNotice) => void,
): void {
  const revision = ++writeRevision;
  const snapshot = snapshotRecord(record);
  notify(onNotice, "saving");
  writeChain = writeChain
    .catch(() => undefined)
    .then(async () => {
      if (revision !== writeRevision) return;
      try {
        const db = await openDatabase();
        await new Promise<void>((resolve, reject) => {
          if (revision !== writeRevision) {
            resolve();
            return;
          }
          const tx = db.transaction(CUSTOMIZATION_STORE, "readwrite");
          tx.objectStore(CUSTOMIZATION_STORE).put(snapshot);
          tx.oncomplete = () => resolve();
          tx.onerror = () =>
            reject(tx.error ?? new Error("Could not save customization session"));
          tx.onabort = () =>
            reject(tx.error ?? new Error("Customization save was aborted"));
        });
        if (revision === writeRevision) notify(onNotice, "saved");
      } catch {
        if (revision === writeRevision) notify(onNotice, "not-saved");
      }
    });
}
