import { track as vercelTrack } from "@vercel/analytics";

export const GREENROAD_EVENTS = [
  "get_tickets_click",
  "ticket_quantity_selected",
  "checkout_started",
  "room_opened",
  "discovery_opened",
  "outbound_click",
  "guest_list_opt_in",
] as const;

export type GreenroadEvent = (typeof GREENROAD_EVENTS)[number];

const ROOMS = new Set([
  "sleep",
  "kitchen",
  "office",
  "bathroom",
  "land",
  "community",
  "custom",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type TrackProperties = {
  quantity?: number;
  value?: number;
  room?: string;
  slug?: string;
};

function cleanProperties(properties: TrackProperties | undefined) {
  if (!properties) return undefined;

  const clean: Record<string, string | number> = {};

  if (
    typeof properties.quantity === "number" &&
    Number.isInteger(properties.quantity) &&
    properties.quantity >= 1 &&
    properties.quantity <= 8
  ) {
    clean.quantity = properties.quantity;
  }

  if (
    typeof properties.value === "number" &&
    Number.isFinite(properties.value) &&
    properties.value > 0 &&
    properties.value <= 200
  ) {
    clean.value = Math.round(properties.value * 100) / 100;
  }

  if (typeof properties.room === "string" && ROOMS.has(properties.room)) {
    clean.room = properties.room;
  }

  if (
    typeof properties.slug === "string" &&
    properties.slug.length <= 80 &&
    SLUG_PATTERN.test(properties.slug)
  ) {
    clean.slug = properties.slug;
  }

  const entries = Object.entries(clean).slice(0, 2);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

export function track(event: GreenroadEvent, properties?: TrackProperties) {
  if (typeof window === "undefined") return;
  if (!GREENROAD_EVENTS.includes(event)) return;

  try {
    const clean = cleanProperties(properties);
    if (clean) vercelTrack(event, clean);
    else vercelTrack(event);
  } catch {
    // A tracking failure must not affect the page or checkout.
  }
}
