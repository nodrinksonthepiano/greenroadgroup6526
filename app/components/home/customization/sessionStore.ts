export const CUSTOMIZATION_DB_NAME = "greenroad-customization";
export const CUSTOMIZATION_STORE = "sessions";
export const ASSET_STORE = "assets";

const DB_VERSION = 2;

export type NormTransform = {
  scale: number;
  xNorm: number;
  yNorm: number;
};

export type ArtworkAsset = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
};

export type CustomizationSession = {
  slug: string;
  variantId: string;
  areaId: string;
  assetId: string | null;
  /** Customer left the lifestyle photo by choosing a tumbler color. */
  colorChosen: boolean;
  /** Product-session treatment. The shared asset Blob stays unchanged. */
  removeBackground: boolean;
  /** Product-session treatment. Flips the engraving mask in the preview. */
  invert: boolean;
  transforms: Record<string, NormTransform>;
};

export type CustomizationBundle = {
  session: CustomizationSession | null;
  assets: ArtworkAsset[];
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
      request.onupgradeneeded = (event) => {
        const db = request.result;
        const tx = request.transaction;
        if (!db.objectStoreNames.contains(CUSTOMIZATION_STORE)) {
          db.createObjectStore(CUSTOMIZATION_STORE, { keyPath: "slug" });
        }
        if (!db.objectStoreNames.contains(ASSET_STORE)) {
          db.createObjectStore(ASSET_STORE, { keyPath: "id" });
        }
        if (event.oldVersion < 2 && event.oldVersion > 0 && tx) {
          migrateEmbeddedArtwork(tx);
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

function migrateEmbeddedArtwork(tx: IDBTransaction) {
  const sessions = tx.objectStore(CUSTOMIZATION_STORE);
  const assets = tx.objectStore(ASSET_STORE);
  const request = sessions.getAll();
  request.onsuccess = () => {
    const records = request.result as Array<Record<string, unknown>>;
    for (const record of records) {
      if (typeof record.slug !== "string") continue;
      const artwork = record.artwork;
      if (artwork instanceof Blob && typeof record.assetId !== "string") {
        const id = crypto.randomUUID();
        const name =
          artwork instanceof File && artwork.name ? artwork.name : "artwork";
        assets.put({
          id,
          name,
          type: artwork.type || "application/octet-stream",
          blob: artwork,
        });
        sessions.put({
          slug: record.slug,
          variantId: record.variantId,
          areaId: record.areaId,
          assetId: id,
          transforms: record.transforms,
        });
        continue;
      }
      if (typeof record.assetId !== "string") {
        sessions.put({
          slug: record.slug,
          variantId: record.variantId,
          areaId: record.areaId,
          assetId: null,
          transforms: record.transforms,
        });
      }
    }
  };
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

function readTransforms(value: unknown): Record<string, NormTransform> {
  if (!value || typeof value !== "object") return {};
  const transforms: Record<string, NormTransform> = {};
  for (const [id, transform] of Object.entries(value)) {
    if (isNorm(transform)) transforms[id] = { ...transform };
  }
  return transforms;
}

function readSession(value: unknown): CustomizationSession | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<CustomizationSession>;
  if (typeof record.slug !== "string") return null;
  if (typeof record.variantId !== "string" || typeof record.areaId !== "string") {
    return null;
  }
  return {
    slug: record.slug,
    variantId: record.variantId,
    areaId: record.areaId,
    assetId: typeof record.assetId === "string" ? record.assetId : null,
    colorChosen: record.colorChosen === true,
    removeBackground: record.removeBackground !== false,
    invert: record.invert === true,
    transforms: readTransforms(record.transforms),
  };
}

function readAsset(value: unknown): ArtworkAsset | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<ArtworkAsset>;
  if (typeof record.id !== "string" || !(record.blob instanceof Blob)) return null;
  return {
    id: record.id,
    name: typeof record.name === "string" && record.name ? record.name : "artwork",
    type: typeof record.type === "string" ? record.type : record.blob.type,
    blob: record.blob,
  };
}

function snapshotSession(record: CustomizationSession): CustomizationSession {
  return {
    slug: record.slug,
    variantId: record.variantId,
    areaId: record.areaId,
    assetId: record.assetId,
    colorChosen: record.colorChosen === true,
    removeBackground: record.removeBackground !== false,
    invert: record.invert === true,
    transforms: readTransforms(record.transforms),
  };
}

function notify(onNotice: (notice: SaveNotice) => void, notice: SaveNotice) {
  try {
    onNotice(notice);
  } catch {
    /* The card can unmount while a write finishes. */
  }
}

export function readCustomizationBundle(slug: string): Promise<CustomizationBundle> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction([CUSTOMIZATION_STORE, ASSET_STORE], "readonly");
        const sessionRequest = tx.objectStore(CUSTOMIZATION_STORE).get(slug);
        const assetRequest = tx.objectStore(ASSET_STORE).getAll();
        let session: CustomizationSession | null = null;
        let assets: ArtworkAsset[] = [];
        sessionRequest.onsuccess = () => {
          session = readSession(sessionRequest.result);
        };
        assetRequest.onsuccess = () => {
          assets = (assetRequest.result as unknown[])
            .map(readAsset)
            .filter((item): item is ArtworkAsset => item !== null);
        };
        tx.oncomplete = () => resolve({ session, assets });
        tx.onerror = () =>
          reject(tx.error ?? new Error("Could not read customization session"));
        tx.onabort = () =>
          reject(tx.error ?? new Error("Customization read was aborted"));
      }),
  );
}

export function sessionsReferencingAsset(assetId: string): Promise<string[]> {
  return writeChain
    .catch(() => undefined)
    .then(() => openDatabase())
    .then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(CUSTOMIZATION_STORE, "readonly");
          const request = tx.objectStore(CUSTOMIZATION_STORE).getAll();
          request.onsuccess = () => {
            const slugs = (request.result as unknown[])
              .map(readSession)
              .filter(
                (item): item is CustomizationSession =>
                  item !== null && item.assetId === assetId,
              )
              .map((item) => item.slug);
            resolve(slugs);
          };
          tx.onerror = () =>
            reject(tx.error ?? new Error("Could not read artwork references"));
          tx.onabort = () =>
            reject(tx.error ?? new Error("Artwork reference read was aborted"));
        }),
    );
}

export function deleteArtworkAsset(
  assetId: string,
  onNotice: (notice: SaveNotice) => void,
): void {
  const revision = ++writeRevision;
  notify(onNotice, "saving");
  writeChain = writeChain.catch(() => undefined).then(async () => {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([CUSTOMIZATION_STORE, ASSET_STORE], "readwrite");
        const sessions = tx.objectStore(CUSTOMIZATION_STORE);
        const request = sessions.getAll();
        request.onsuccess = () => {
          for (const value of request.result as unknown[]) {
            const session = readSession(value);
            if (!session || session.assetId !== assetId) continue;
            sessions.put(snapshotSession({ ...session, assetId: null }));
          }
          tx.objectStore(ASSET_STORE).delete(assetId);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
          reject(tx.error ?? new Error("Could not delete artwork"));
        tx.onabort = () =>
          reject(tx.error ?? new Error("Artwork delete was aborted"));
      });
      if (revision === writeRevision) notify(onNotice, "saved");
    } catch {
      if (revision === writeRevision) notify(onNotice, "not-saved");
    }
  });
}

export function writeCustomizationSession(
  record: CustomizationSession,
  onNotice: (notice: SaveNotice) => void,
  asset?: ArtworkAsset,
): void {
  const revision = ++writeRevision;
  const snapshot = snapshotSession(record);
  notify(onNotice, "saving");
  writeChain = writeChain
    .catch(() => undefined)
    .then(async () => {
      try {
        const db = await openDatabase();
        await new Promise<void>((resolve, reject) => {
          const stores = asset
            ? [CUSTOMIZATION_STORE, ASSET_STORE]
            : [CUSTOMIZATION_STORE];
          const tx = db.transaction(stores, "readwrite");
          if (asset) tx.objectStore(ASSET_STORE).put(asset);
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
