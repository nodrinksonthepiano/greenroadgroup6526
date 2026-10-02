"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { Discovery } from "@/data/types/discovery";
import { searchDiscoveries } from "@/data/discoverySearch";
import { rememberVisitUtm } from "@/lib/utm";

export type CommandMode = "explore" | "join";

export interface CommandSearchHandle {
  focusEmail: () => void;
}

interface CommandSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectDiscovery: (discovery: Discovery) => void;
}

const CONSENT_COPY =
  "Join the Green Road for discoveries, better everyday goods, gatherings, and occasional updates.";

export const CommandSearch = forwardRef<CommandSearchHandle, CommandSearchProps>(
  function CommandSearch(
    { searchQuery, onSearchChange, onSelectDiscovery },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const requestId = useRef(0);
    const [mode, setMode] = useState<CommandMode>("explore");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [phase, setPhase] = useState<"form" | "submitting" | "success">(
      "form",
    );
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function resetJoin() {
      requestId.current += 1;
      setPhase("form");
      setEmail("");
      setFirstName("");
      setError("");
      setSuccessMessage("");
    }

    useImperativeHandle(ref, () => ({
      focusEmail: () => {
        requestId.current += 1;
        setMode("join");
        setPhase("form");
        setError("");
        setSuccessMessage("");
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

    async function handleJoin(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setError("");
      setPhase("submitting");
      const id = ++requestId.current;
      const utm = rememberVisitUtm();
      try {
        const response = await fetch("/api/community/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName,
            utm_source: utm.utm_source,
            utm_medium: utm.utm_medium,
            utm_campaign: utm.utm_campaign,
          }),
        });
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (id !== requestId.current) return;
        if (!response.ok) {
          setError(payload?.error ?? "Could not join right now. Please try again.");
          setPhase("form");
          return;
        }
        setSuccessMessage("You're on the Green Road. Check your inbox.");
        setPhase("success");
      } catch {
        if (id !== requestId.current) return;
        setError("Could not join right now. Please try again.");
        setPhase("form");
      }
    }

    return (
      <footer
        id="join-section"
        className={`command-search${mode === "join" ? " command-search--join" : ""}`}
        aria-label="Explore and join"
      >
        <div
          className={`command-search__inner${mode === "explore" ? " command-search__inner--explore" : " command-search__inner--join"}`}
        >
          {mode === "join" && (
            <div className="join-card">
              <button
                type="button"
                className="join-card__back"
                onClick={() => {
                  setMode("explore");
                  resetJoin();
                  window.setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                ← Explore
              </button>
              <h2 className="join-card__title">Join the Green Road</h2>
              {phase === "success" ? (
                <p className="join-card__success" role="status">
                  {successMessage}
                </p>
              ) : (
                <>
                  <p className="join-card__support">
                    Kind to your wallet and kind to the earth.
                  </p>
                  <form
                    className="join-card__form"
                    onSubmit={handleJoin}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      event.currentTarget.requestSubmit();
                    }}
                  >
                    <label className="join-card__field" htmlFor="greenroad-join-name">
                      <span className="join-card__label">
                        First name <span>optional</span>
                      </span>
                      <input
                        id="greenroad-join-name"
                        type="text"
                        name="firstName"
                        autoComplete="given-name"
                        maxLength={80}
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        disabled={phase === "submitting"}
                      />
                    </label>
                    <label className="join-card__field" htmlFor="greenroad-join-email">
                      <span className="join-card__label">Email</span>
                      <input
                        ref={inputRef}
                        id="greenroad-join-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={phase === "submitting"}
                        aria-describedby="greenroad-join-consent"
                      />
                    </label>
                    {error && (
                      <p className="join-card__error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="join-card__submit"
                      disabled={phase === "submitting"}
                    >
                      {phase === "submitting" ? "Joining…" : "Join the Green Road"}
                    </button>
                    <p id="greenroad-join-consent" className="join-card__consent">
                      {CONSENT_COPY}
                    </p>
                  </form>
                </>
              )}
            </div>
          )}

          {mode === "explore" && (
            <input
              ref={inputRef}
              id="greenroad-command"
              type="search"
              className="command-search__input"
              placeholder="What do you want to explore, learn, or buy?"
              aria-label="What do you want to explore, learn, or buy?"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          )}

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
        </div>
      </footer>
    );
  },
);
