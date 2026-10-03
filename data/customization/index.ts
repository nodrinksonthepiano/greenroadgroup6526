import type { ProductCustomization } from "./types";
import tumbler20 from "./pod-adventure-brite-tumbler-20oz.json";

const CUSTOMIZATIONS: ProductCustomization[] = [
  tumbler20 as ProductCustomization,
];

export function getProductCustomization(
  slug: string,
): ProductCustomization | null {
  return CUSTOMIZATIONS.find((item) => item.slug === slug) ?? null;
}

export type {
  ProductCustomization,
  CustomizationVariant,
  DecorationArea,
  NormalizedBox,
} from "./types";
