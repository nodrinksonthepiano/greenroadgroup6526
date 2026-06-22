import type { Discovery, Supplier } from "./types/discovery";

import deskPlantsDiscovery from "./discoveries/desk-plants-mini-harlow.json";
import podAdventureBriteTumbler from "./discoveries/pod-adventure-brite-tumbler-20oz.json";
import deskPlantsSupplier from "./suppliers/desk-plants.json";
import adgPromoSupplier from "./suppliers/adg-promo.json";

/** All discovery slugs in load order. Add new slugs here when Rebecca adds JSON files. */
export const DISCOVERY_SLUGS = [
  "desk-plants-mini-harlow",
  "pod-adventure-brite-tumbler-20oz",
] as const;

export type DiscoverySlug = (typeof DISCOVERY_SLUGS)[number];

const discoveriesBySlug: Record<DiscoverySlug, Discovery> = {
  "desk-plants-mini-harlow": deskPlantsDiscovery as Discovery,
  "pod-adventure-brite-tumbler-20oz": podAdventureBriteTumbler as Discovery,
};

const suppliersById: Record<string, Supplier> = {
  "desk-plants": deskPlantsSupplier as Supplier,
  "adg-promo": adgPromoSupplier as Supplier,
};

export function getDiscovery(slug: DiscoverySlug): Discovery {
  return discoveriesBySlug[slug];
}

export function getAllDiscoveries(): Discovery[] {
  return DISCOVERY_SLUGS.map((slug) => discoveriesBySlug[slug]);
}

export function getSupplier(id: string): Supplier | undefined {
  return suppliersById[id];
}

export function getSupplierForDiscovery(discovery: Discovery): Supplier | undefined {
  if (!discovery.supplier_id) return undefined;
  return suppliersById[discovery.supplier_id];
}
