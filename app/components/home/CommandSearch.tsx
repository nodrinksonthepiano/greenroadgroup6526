"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useState,
} from "react";
import type { Discovery } from "@/data/types/discovery";
import { searchDiscoveries } from "@/data/discoverySearch";

export type CommandMode = "explore" | "join";

export interface CommandSearchHandle {
  focusEmail: () => void;
}

interface CommandSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectDiscovery: (discovery: Discovery) => void;
}

export const CommandSearch = forwardRef<CommandSearchHandle, CommandSearchProps>(
  function CommandSearch(
    { searchQuery, onSearchChange, onSelectDiscovery },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<CommandMode>("explore");
    const [email, setEmail] = useState("");

    useImperativeHandle(ref, () => ({
      focusEmail: () => {
        setMode("join");
        window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      },
    }));

    const results = useMemo(
      () =>
        mode === "explore" && searchQuery.trim()
          ? searchDiscoveries(searchQuery)
          : [],
      [mode, searchQuery],
    );

    return (
      <footer
        id="join-section"
        className="command-search"
        aria-label="Explore and join"
      >
        <div className="command-search__inner">
          <div className="command-search__mode-row">
            <label className="command-search__label" htmlFor="greenroad-command">
              {mode === "explore"
                ? "Explore discoveries"
                : "Begin your Green Road"}
            </label>
            {mode === "join" && (
              <button
                type="button"
                className="command-search__mode-back"
                onClick={() => {
                  setMode("explore");
                  inputRef.current?.focus();
                }}
              >
                ← Explore
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            id="greenroad-command"
            type={mode === "join" ? "email" : "search"}
            className={`command-search__input${mode === "join" ? " command-search__input--join" : ""}`}
            placeholder={
              mode === "join"
                ? "your@email.com"
                : "What do you want to explore, learn, or buy?"
            }
            aria-label={
              mode === "join"
                ? "Email to begin Your Green Road"
                : "What do you want to explore, learn, or buy?"
            }
            autoComplete={mode === "join" ? "email" : "off"}
            value={mode === "join" ? email : searchQuery}
            onChange={(e) => {
              if (mode === "join") {
                setEmail(e.target.value);
              } else {
                onSearchChange(e.target.value);
              }
            }}
          />

          {results.length > 0 && (
            <ul className="command-search__results" role="listbox">
              {results.map((discovery) => (
                <li key={discovery.id}>
                  <button
                    type="button"
                    className="command-search__result"
                    onClick={() => onSelectDiscovery(discovery)}
                  >
                    <span className="command-search__result-title">
                      {discovery.title}
                    </span>
                    <span className="command-search__result-meta">
                      {discovery.room} · {discovery.system}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="command-search__hint">
            {mode === "explore"
              ? "Explore · learn · buy"
              : "Email saves your path (coming soon)"}
          </p>
        </div>
      </footer>
    );
  },
);
