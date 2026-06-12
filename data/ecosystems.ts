import type { Room } from "./types/discovery";

export interface Ecosystem {
  id: Room;
  label: string;
  tagline: string;
  coming_into_view: string;
}

/** Rooms are ecosystems, not categories. */
export const ECOSYSTEMS: Ecosystem[] = [
  {
    id: "sleep",
    label: "Sleep",
    tagline: "Sleep Ecosystem",
    coming_into_view:
      "We're collecting discoveries for better sleep, restoration, comfort, and recovery.",
  },
  {
    id: "office",
    label: "Office",
    tagline: "Office Ecosystem",
    coming_into_view:
      "We're collecting discoveries for focus, plants, light, ergonomics, and a workspace that feels alive.",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    tagline: "Kitchen Ecosystem",
    coming_into_view:
      "We're collecting discoveries for coffee, storage, hosting, cleaning, and everyday kitchen alternatives.",
  },
  {
    id: "bathroom",
    label: "Bathroom",
    tagline: "Bathroom Ecosystem",
    coming_into_view:
      "We're collecting discoveries for hygiene, cleaning, and practical bathroom alternatives.",
  },
  {
    id: "land",
    label: "Land",
    tagline: "Land Ecosystem",
    coming_into_view:
      "We're collecting discoveries for lawn, garden, outdoor living, and land stewardship.",
  },
  {
    id: "community",
    label: "Community",
    tagline: "Community Ecosystem",
    coming_into_view:
      "We're collecting discoveries we can grow together — local makers, gatherings, and shared Green Road stories.",
  },
  {
    id: "custom",
    label: "Custom",
    tagline: "Custom Goods",
    coming_into_view:
      "Upload your art, logo, or name. Preview your proof. Gribbit it. Patches, stickers, tumblers, and more — minimum order of one.",
  },
];

export function getEcosystem(id: Room): Ecosystem | undefined {
  return ECOSYSTEMS.find((e) => e.id === id);
}
