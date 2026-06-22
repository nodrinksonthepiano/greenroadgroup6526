/**
 * Greenroad Discovery data model (Session 2).
 * JSON discovery files should match these types.
 * Rebecca edits JSON; TypeScript keeps Session 3+ type-safe.
 */

export const DISCOVERY_TYPES = [
  "product",
  "package",
  "guide",
  "supplier",
  "room",
  "local",
  "event",
] as const;

export type DiscoveryType = (typeof DISCOVERY_TYPES)[number];

export const ROOMS = [
  "sleep",
  "kitchen",
  "office",
  "bathroom",
  "land",
  "community",
  "custom",
] as const;

export type Room = (typeof ROOMS)[number];

export const COMMERCE_BUCKETS = [
  "direct",
  "warm",
  "affiliate",
  "original",
] as const;

export type CommerceBucket = (typeof COMMERCE_BUCKETS)[number];

export const SALE_TYPES = [
  "direct_resale",
  "affiliate_link",
  "showcase_only",
  "inquiry",
] as const;

export type SaleType = (typeof SALE_TYPES)[number];

export interface WebSignal {
  source: string;
  signal: string;
}

export interface WhatPeopleAreSaying {
  loved_for: string[];
  criticized_for: string[];
}

export interface DiscoveryFaq {
  q: string;
  a: string;
}

export interface DiscoveryCommerce {
  bucket: CommerceBucket;
  sale_type: SaleType;
  list_price: number | null;
  greenroad_price: number | null;
  stripe_price_id: string | null;
  affiliate_url: string | null;
  product_url: string | null;
}

export interface Discovery {
  id: string;
  slug: string;
  type: DiscoveryType;
  title: string;
  room: Room;
  system: string;
  alternative_to: string[];
  /** Landing-page hook only — warmer than alternative_to SEO language. */
  featured_hook?: string;
  problem_solved: string[];
  why_we_like_it: string[];
  considerations: string[];
  evidence: string[];
  what_people_are_saying: WhatPeopleAreSaying;
  signals_from_web: WebSignal[];
  supplier_id: string | null;
  hero_image: string;
  seo_title: string;
  seo_description: string;
  faqs: DiscoveryFaq[];
  commerce: DiscoveryCommerce;
  featured: boolean;
  published: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  website: string;
  relationship: "direct" | "warm" | "affiliate";
  via: string | null;
  story: string;
  capabilities: string[];
}
