import type { Room } from "./types/discovery";

/**
 * Per-room background imagery. Kept separate from `data/ecosystems.ts` so the
 * ecosystem data shape stays untouched. All rooms share one atmospheric
 * forest/sky scene for now; swap individual entries as room-specific art lands.
 */
const SHARED_BACKGROUND = "/backgrounds/greenroad-forest-sky.webp";

export const ROOM_BACKGROUNDS: Record<Room, string> = {
  sleep: SHARED_BACKGROUND,
  kitchen: SHARED_BACKGROUND,
  office: SHARED_BACKGROUND,
  bathroom: SHARED_BACKGROUND,
  land: SHARED_BACKGROUND,
  community: SHARED_BACKGROUND,
  custom: SHARED_BACKGROUND,
};

export function getRoomBackground(room: Room): string {
  return ROOM_BACKGROUNDS[room] ?? SHARED_BACKGROUND;
}
