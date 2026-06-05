"use client";

import { ECOSYSTEMS } from "@/data/ecosystems";
import type { Room } from "@/data/types/discovery";

interface EcosystemOrbitRingProps {
  activeEcosystem: Room;
  onSelect: (id: Room) => void;
}

const ORBIT_RADIUS_X = 54;
const ORBIT_RADIUS_Y = 52;

export function EcosystemOrbitRing({
  activeEcosystem,
  onSelect,
}: EcosystemOrbitRingProps) {
  return (
    <div className="discovery-stage__orbit" aria-label="Explore ecosystems">
      {ECOSYSTEMS.map((ecosystem, index) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * index) / ECOSYSTEMS.length;
        const left = 50 + Math.cos(angle) * ORBIT_RADIUS_X;
        const top = 50 + Math.sin(angle) * ORBIT_RADIUS_Y;
        const isActive = ecosystem.id === activeEcosystem;

        return (
          <button
            key={ecosystem.id}
            type="button"
            className={`ecosystem-orbit__node${isActive ? " ecosystem-orbit__node--active" : ""}`}
            style={{ left: `${left}%`, top: `${top}%` }}
            onClick={() => onSelect(ecosystem.id)}
            aria-pressed={isActive}
            aria-label={`${ecosystem.tagline}`}
          >
            {ecosystem.label}
          </button>
        );
      })}
    </div>
  );
}
