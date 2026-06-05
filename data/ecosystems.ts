import type { Room } from "./types/discovery";

export interface Ecosystem {
  id: Room;
  label: string;
  tagline: string;
}

/** Rooms are ecosystems, not categories. */
export const ECOSYSTEMS: Ecosystem[] = [
  { id: "sleep", label: "Sleep", tagline: "Sleep Ecosystem" },
  { id: "office", label: "Office", tagline: "Office Ecosystem" },
  { id: "kitchen", label: "Kitchen", tagline: "Kitchen Ecosystem" },
  { id: "bathroom", label: "Bathroom", tagline: "Bathroom Ecosystem" },
  { id: "land", label: "Land", tagline: "Land Ecosystem" },
  { id: "community", label: "Community", tagline: "Community Ecosystem" },
];

export function getEcosystem(id: Room): Ecosystem | undefined {
  return ECOSYSTEMS.find((e) => e.id === id);
}
