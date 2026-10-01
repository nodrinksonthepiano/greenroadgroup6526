export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type VisitUtm = Record<UtmKey, string | null>;

const UTM_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const STORAGE_KEY = "gr_visit_utm";

export function emptyVisitUtm(): VisitUtm {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
  };
}

export function sanitizeUtmValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!UTM_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function sanitizeVisitUtm(input: unknown): VisitUtm {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    utm_source: sanitizeUtmValue(source.utm_source),
    utm_medium: sanitizeUtmValue(source.utm_medium),
    utm_campaign: sanitizeUtmValue(source.utm_campaign),
  };
}

export function hasVisitUtm(utm: VisitUtm): boolean {
  return UTM_KEYS.some((key) => utm[key] !== null);
}

function utmFromSearch(search: string): VisitUtm {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return sanitizeVisitUtm({
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  });
}

export function analyticsPath(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, "https://www.greenroad.group");
    const utm = utmFromSearch(url.search);
    const params = new URLSearchParams();
    for (const key of UTM_KEYS) {
      const value = utm[key];
      if (value) params.set(key, value);
    }
    const search = params.toString();
    const path = `${url.pathname}${search ? `?${search}` : ""}`;
    return rawUrl.startsWith("http") ? `${url.origin}${path}` : path;
  } catch {
    const path = rawUrl.split("?")[0]?.split("#")[0] ?? "/";
    return path.startsWith("/") ? path : "/";
  }
}

export function rememberVisitUtm(): VisitUtm {
  if (typeof window === "undefined") return emptyVisitUtm();

  const fromUrl = utmFromSearch(window.location.search);
  if (hasVisitUtm(fromUrl)) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyVisitUtm();
    return sanitizeVisitUtm(JSON.parse(stored) as unknown);
  } catch {
    return emptyVisitUtm();
  }
}
