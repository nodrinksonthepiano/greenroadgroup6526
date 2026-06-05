"use client";

import { useState } from "react";
import type { Discovery } from "@/data/types/discovery";

interface DiscoveryAccordionsProps {
  discovery: Discovery;
}

type SectionId =
  | "problem_solved"
  | "why_we_like_it"
  | "considerations"
  | "evidence"
  | "what_people_are_saying"
  | "signals_from_web";

const SECTIONS: { id: SectionId; title: string }[] = [
  { id: "problem_solved", title: "Problem Solved" },
  { id: "why_we_like_it", title: "Why We Like It" },
  { id: "considerations", title: "Considerations" },
  { id: "evidence", title: "Evidence" },
  { id: "what_people_are_saying", title: "What People Are Saying" },
  { id: "signals_from_web", title: "Signals From Around The Web" },
];

function AccordionItem({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="discovery-accordion">
      <button
        type="button"
        className="discovery-accordion__trigger"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span
          className={`discovery-accordion__chevron${open ? " discovery-accordion__chevron--open" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && <div className="discovery-accordion__panel">{children}</div>}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="discovery-accordion__list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function DiscoveryAccordions({ discovery }: DiscoveryAccordionsProps) {
  const [openId, setOpenId] = useState<SectionId>("problem_solved");

  return (
    <section
      id="discovery-context"
      className="discovery-accordions"
      aria-label="Discovery context"
    >
      <h2 className="home-section-title">Discovery Context</h2>
      <p className="home-section-subtitle">
        Honest context — guide, not judge.
      </p>

      {SECTIONS.map((section) => (
        <AccordionItem
          key={section.id}
          title={section.title}
          open={openId === section.id}
          onToggle={() => setOpenId(section.id)}
        >
          {section.id === "problem_solved" && (
            <BulletList items={discovery.problem_solved} />
          )}
          {section.id === "why_we_like_it" && (
            <BulletList items={discovery.why_we_like_it} />
          )}
          {section.id === "considerations" && (
            <BulletList items={discovery.considerations} />
          )}
          {section.id === "evidence" && (
            <BulletList items={discovery.evidence} />
          )}
          {section.id === "what_people_are_saying" && (
            <>
              <div className="discovery-accordion__subsection">
                <p className="discovery-accordion__subsection-title">Loved For</p>
                <BulletList items={discovery.what_people_are_saying.loved_for} />
              </div>
              <div className="discovery-accordion__subsection">
                <p className="discovery-accordion__subsection-title">
                  Criticized For
                </p>
                <BulletList
                  items={discovery.what_people_are_saying.criticized_for}
                />
              </div>
            </>
          )}
          {section.id === "signals_from_web" && (
            <div className="discovery-accordion__signals">
              {discovery.signals_from_web.map((signal) => (
                <div
                  key={`${signal.source}-${signal.signal}`}
                  className="discovery-accordion__signal"
                >
                  <p className="discovery-accordion__signal-source">
                    {signal.source}
                  </p>
                  <p className="discovery-accordion__signal-text">{signal.signal}</p>
                </div>
              ))}
            </div>
          )}
        </AccordionItem>
      ))}
    </section>
  );
}
