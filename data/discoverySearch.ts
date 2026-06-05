import type { Discovery, Room } from "./types/discovery";
import { getAllDiscoveries } from "./index";
import { ECOSYSTEMS } from "./ecosystems";

function discoveryHaystack(discovery: Discovery): string {
  const { what_people_are_saying: wps, signals_from_web: signals } = discovery;
  return [
    discovery.title,
    discovery.room,
    discovery.system,
    discovery.seo_title,
    discovery.seo_description,
    ...discovery.alternative_to,
    ...discovery.problem_solved,
    ...discovery.why_we_like_it,
    ...discovery.considerations,
    ...discovery.evidence,
    ...wps.loved_for,
    ...wps.criticized_for,
    ...signals.map((s) => `${s.source} ${s.signal}`),
  ]
    .join(" ")
    .toLowerCase();
}

export function searchDiscoveries(query: string): Discovery[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);
  const discoveries = getAllDiscoveries();

  const ecosystemMatches = ECOSYSTEMS.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.tagline.toLowerCase().includes(q) ||
      e.coming_into_view.toLowerCase().includes(q),
  ).map((e) => e.id);

  return discoveries.filter((discovery) => {
    const haystack = discoveryHaystack(discovery);
    const termMatch = terms.every((term) => haystack.includes(term));
    const ecosystemMatch = ecosystemMatches.includes(discovery.room);
    return termMatch || ecosystemMatch;
  });
}

export function getDiscoveryForEcosystem(
  ecosystem: Room,
  discoveries: Discovery[] = getAllDiscoveries(),
): Discovery | undefined {
  return discoveries.find((d) => d.room === ecosystem);
}

export type FeaturedView =
  | { mode: "discovery"; discovery: Discovery }
  | { mode: "coming-into-view"; ecosystem: Room };

export function matchEcosystemQuery(query: string): Room | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const match = ECOSYSTEMS.find(
    (e) =>
      e.id.includes(q) ||
      e.label.toLowerCase().includes(q) ||
      e.tagline.toLowerCase().includes(q) ||
      e.coming_into_view.toLowerCase().includes(q),
  );

  return match?.id ?? null;
}

export function resolveFeaturedView(
  activeEcosystem: Room,
  searchQuery: string,
  pinnedDiscovery: Discovery | null,
): FeaturedView {
  if (pinnedDiscovery) {
    return { mode: "discovery", discovery: pinnedDiscovery };
  }

  if (searchQuery.trim()) {
    const results = searchDiscoveries(searchQuery);
    if (results.length > 0) {
      return { mode: "discovery", discovery: results[0] };
    }
    const ecosystemMatch = matchEcosystemQuery(searchQuery);
    if (ecosystemMatch) {
      const roomDiscovery = getDiscoveryForEcosystem(ecosystemMatch);
      if (roomDiscovery) {
        return { mode: "discovery", discovery: roomDiscovery };
      }
      return { mode: "coming-into-view", ecosystem: ecosystemMatch };
    }
    return { mode: "coming-into-view", ecosystem: activeEcosystem };
  }

  const match = getDiscoveryForEcosystem(activeEcosystem);
  if (match) {
    return { mode: "discovery", discovery: match };
  }

  return { mode: "coming-into-view", ecosystem: activeEcosystem };
}
