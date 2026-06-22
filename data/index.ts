import type { Discovery, Supplier } from "./types/discovery";

import deskPlantsDiscovery from "./discoveries/desk-plants-mini-harlow.json";
import podAdventureBriteTumbler from "./discoveries/pod-adventure-brite-tumbler-20oz.json";
import carilohaResortBambooSheets from "./discoveries/cariloha-resort-bamboo-sheets.json";
import purityCoffeeEaseDarkRoast from "./discoveries/purity-coffee-ease-dark-roast.json";
import betterwayBambooToiletPaper from "./discoveries/betterway-bamboo-toilet-paper.json";
import egoZ6ZeroTurnMower from "./discoveries/ego-z6-zero-turn-mower.json";
import podCruiseBriteTumbler12oz from "./discoveries/pod-cruise-brite-tumbler-12oz.json";
import podAccentMugFullColor11oz from "./discoveries/pod-accent-mug-full-color-11oz.json";
import podAdultFleeceHoodieFullColor from "./discoveries/pod-adult-fleece-hoodie-full-color.json";
import deskPlantsSupplier from "./suppliers/desk-plants.json";
import adgPromoSupplier from "./suppliers/adg-promo.json";
import carilohaSupplier from "./suppliers/cariloha.json";
import purityCoffeeSupplier from "./suppliers/purity-coffee.json";
import betterwaySupplier from "./suppliers/betterway.json";
import egoPowerPlusSupplier from "./suppliers/ego-power-plus.json";

/** All discovery slugs in load order. Add new slugs here when Rebecca adds JSON files. */
export const DISCOVERY_SLUGS = [
  "pod-adventure-brite-tumbler-20oz",
  "desk-plants-mini-harlow",
  "cariloha-resort-bamboo-sheets",
  "purity-coffee-ease-dark-roast",
  "betterway-bamboo-toilet-paper",
  "ego-z6-zero-turn-mower",
  "pod-cruise-brite-tumbler-12oz",
  "pod-accent-mug-full-color-11oz",
  "pod-adult-fleece-hoodie-full-color",
] as const;

export type DiscoverySlug = (typeof DISCOVERY_SLUGS)[number];

const discoveriesBySlug: Record<DiscoverySlug, Discovery> = {
  "pod-adventure-brite-tumbler-20oz": podAdventureBriteTumbler as Discovery,
  "desk-plants-mini-harlow": deskPlantsDiscovery as Discovery,
  "cariloha-resort-bamboo-sheets": carilohaResortBambooSheets as Discovery,
  "purity-coffee-ease-dark-roast": purityCoffeeEaseDarkRoast as Discovery,
  "betterway-bamboo-toilet-paper": betterwayBambooToiletPaper as Discovery,
  "ego-z6-zero-turn-mower": egoZ6ZeroTurnMower as Discovery,
  "pod-cruise-brite-tumbler-12oz": podCruiseBriteTumbler12oz as Discovery,
  "pod-accent-mug-full-color-11oz": podAccentMugFullColor11oz as Discovery,
  "pod-adult-fleece-hoodie-full-color":
    podAdultFleeceHoodieFullColor as Discovery,
};

const suppliersById: Record<string, Supplier> = {
  "desk-plants": deskPlantsSupplier as Supplier,
  "adg-promo": adgPromoSupplier as Supplier,
  cariloha: carilohaSupplier as Supplier,
  "purity-coffee": purityCoffeeSupplier as Supplier,
  betterway: betterwaySupplier as Supplier,
  "ego-power-plus": egoPowerPlusSupplier as Supplier,
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
