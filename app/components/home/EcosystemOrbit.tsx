"use client";

import { useState } from "react";
import { ECOSYSTEMS } from "@/data/ecosystems";
import type { Room } from "@/data/types/discovery";

interface EcosystemOrbitProps {
  activeEcosystem: Room;
  onSelect: (id: Room) => void;
}

const ORBIT_RADIUS_X = 42;
const ORBIT_RADIUS_Y = 42;

export function EcosystemOrbit({ activeEcosystem, onSelect }: EcosystemOrbitProps) {
  return (
    <section className="ecosystem-orbit-section" aria-label="Explore ecosystems">
      <h2 className="home-section-title">Explore Ecosystems</h2>
      <p className="home-section-subtitle">
        Rooms are living collections — not product categories.
      </p>

      <div className="ecosystem-orbit">
        <div className="ecosystem-orbit__ring" aria-hidden />

        {ECOSYSTEMS.map((ecosystem, index) => {
          const angle =
            -Math.PI / 2 + (2 * Math.PI * index) / ECOSYSTEMS.length;
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
            >
              {ecosystem.label}
            </button>
          );
        })}
      </div>

      <p className="ecosystem-orbit__hint">
        Tap an ecosystem to explore — more discoveries arrive soon.
      </p>
    </section>
  );
}

/** Controlled wrapper with local state defaulting to office for Desk Plants. */
export function EcosystemOrbitShell({ initialRoom = "office" as Room }) {
  const [active, setActive] = useState<Room>(initialRoom);
  return <EcosystemOrbit activeEcosystem={active} onSelect={setActive} />;
}
