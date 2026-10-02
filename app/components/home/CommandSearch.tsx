"use client";

import {
  forwardRef,
  useEffect,
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
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const barRef = useRef<HTMLElement>(null);
    const requestId = useRef(0);
    const [mode, setMode] = useState<CommandMode>("explore");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [phase, setPhase] = useState<"ready" | "submitting" | "success">(
      "ready",
    );
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function resetJoin() {
      requestId.current += 1;
      setPhase("ready");
      setEmail("");
      setFirstName("");
      setError("");
      setSuccessMessage("");
    }

    function returnToExplore() {
      setMode("explore");
      resetJoin();
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }

    useEffect(() => {
      const bar = barRef.current;
      const viewport = window.visualViewport;
      if (!bar || !viewport) return;

      const liftAboveKeyboard = () => {
        const overlap = Math.max(
          0,
          window.innerHeight - viewport.height - viewport.offsetTop,
        );
        bar.style.bottom = overlap > 0 ? `${overlap}px` : "";
      };

      liftAboveKeyboard();
      viewport.addEventListener("resize", liftAboveKeyboard);
      viewport.addEventListener("scroll", liftAboveKeyboard);
      return () => {
        viewport.removeEventListener("resize", liftAboveKeyboard);
        viewport.removeEventListener("scroll", liftAboveKeyboard);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      focusEmail: () => {
        requestId.current += 1;
        setMode("join");
        setPhase("ready");
        setError("");
        setSuccessMessage("");
        window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 50);
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
      if (phase === "submitting") return;
      if (!email.trim()) {
        emailRef.current?.focus();
        return;
      }
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
          setPhase("ready");
          return;
        }
        setSuccessMessage("You're on the Green Road. Check your inbox.");
        setPhase("success");
      } catch {
        if (id !== requestId.current) return;
        setError("Could not join right now. Please try again.");
        setPhase("ready");
      }
    }

    return (
      <footer
        ref={barRef}
        id="join-section"
        className={`command-search${mode === "join" ? " command-search--join" : ""}`}
        aria-label="Explore and join"
      >
        <div
          className={`command-search__inner${mode === "explore" ? " command-search__inner--explore" : ""}`}
        >
          {mode === "join" && (
            <div className="command-search__mode-row">
              <p className="command-search__label">Join the Green Road</p>
              <button
                type="button"
                className="command-search__mode-back"
                aria-label="Back to explore"
                onClick={returnToExplore}
              >
                <span>← Explore</span>
                <span className="command-search__close-x" aria-hidden="true">
                  ×
                </span>
              </button>
            </div>
          )}

          {mode === "join" && phase === "success" && (
            <p className="command-search__success" role="status">
              {successMessage}
            </p>
          )}

          {mode === "join" && phase !== "success" && (
            <form
              className="command-search__join"
              onSubmit={handleJoin}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                if (phase === "submitting") {
                  event.preventDefault();
                  return;
                }
                if (event.target === nameRef.current) {
                  event.preventDefault();
                  emailRef.current?.focus();
                  return;
                }
                if (event.target === emailRef.current) {
                  event.preventDefault();
                  event.currentTarget.requestSubmit();
                }
              }}
            >
              <p className="command-search__hint">
                Kind to your wallet and kind to the earth.
              </p>
              <div className="command-search__fields">
                <input
                  ref={nameRef}
                  id="greenroad-join-name"
                  type="text"
                  className="command-search__input"
                  placeholder="First name (optional)"
                  aria-label="First name, optional"
                  autoComplete="given-name"
                  maxLength={80}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  disabled={phase === "submitting"}
                />
                <div className="command-search__pill">
                  <input
                    ref={emailRef}
                    id="greenroad-join-email"
                    type="email"
                    className="command-search__input command-search__input--join"
                    placeholder="Email"
                    aria-label="Email"
                    aria-describedby="greenroad-join-consent"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={phase === "submitting"}
                  />
                  <button
                    type="submit"
                    className="command-search__send"
                    aria-label={phase === "submitting" ? "Joining" : "Join"}
                    aria-busy={phase === "submitting"}
                    disabled={phase === "submitting"}
                  >
                    {phase === "submitting" ? "…" : "→"}
                  </button>
                </div>
              </div>
              {error && (
                <p className="command-search__error" role="alert">
                  {error}
                </p>
              )}
              <p id="greenroad-join-consent" className="command-search__consent">
                {CONSENT_COPY}
              </p>
            </form>
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
