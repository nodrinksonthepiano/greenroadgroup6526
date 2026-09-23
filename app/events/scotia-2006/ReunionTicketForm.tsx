"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import styles from "./reunion.module.css";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type AvailabilityState = "loading" | "available" | "paused" | "held" | "sold_out";
type PurchaseStep = "quantity" | "purchaser";

interface Availability {
  state: Exclude<AvailabilityState, "loading">;
  remaining: number;
  maxPerOrder: number;
  unitAmountCents: number;
}

interface VerifiedTicket {
  number: string;
  status: string;
}

interface OrderStatus {
  state: string;
  quantity: number | null;
  tickets: VerifiedTicket[];
}

interface GuestList {
  optedIn: boolean;
  guestListName: string;
  suggestedName: string;
  names: string[];
}

const emptyGuestList: GuestList = {
  optedIn: false,
  guestListName: "",
  suggestedName: "",
  names: [],
};

function readGuestList(value: unknown): GuestList | null {
  if (!value || typeof value !== "object") return null;
  if (
    !("optedIn" in value) ||
    !("guestListName" in value) ||
    !("suggestedName" in value) ||
    !("names" in value)
  ) {
    return null;
  }
  const optedIn = value.optedIn;
  const guestListName = value.guestListName;
  const suggestedName = value.suggestedName;
  const names = value.names;
  if (typeof optedIn !== "boolean") return null;
  if (typeof guestListName !== "string" || typeof suggestedName !== "string") {
    return null;
  }
  if (!Array.isArray(names) || !names.every((name) => typeof name === "string")) {
    return null;
  }
  return { optedIn, guestListName, suggestedName, names };
}

export function ReunionTicketForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const checkoutCancelled = searchParams.get("checkout") === "cancelled";
  const requestIdRef = useRef<string | null>(null);
  const ticketCardRef = useRef<HTMLDivElement>(null);
  const purchaserNameRef = useRef<HTMLInputElement>(null);

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState>("loading");
  const [quantity, setQuantity] = useState(1);
  const [purchaseStep, setPurchaseStep] =
    useState<PurchaseStep>("quantity");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [connectionNote, setConnectionNote] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [embeddedSessionId, setEmbeddedSessionId] = useState<string | null>(
    null,
  );
  const [confirmationSessionId, setConfirmationSessionId] = useState<
    string | null
  >(sessionId);
  const [formError, setFormError] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [guestList, setGuestList] = useState<GuestList | null>(null);
  const [guestListError, setGuestListError] = useState("");
  const [guestListSaving, setGuestListSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameDirty, setNameDirty] = useState(false);
  const nameDirtyRef = useRef(false);
  const [buyerState, setBuyerState] = useState<"checking" | "buyer" | "public">(
    "checking",
  );
  const guestRequestRef = useRef(0);
  const paidThisVisitRef = useRef(false);
  const dismissedReturnRef = useRef(false);
  const [guestListRoot, setGuestListRoot] = useState<HTMLElement | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    sessionId
      ? "Verifying your payment…"
      : checkoutCancelled
        ? "Checkout was canceled. No payment has been confirmed."
        : "",
  );

  const loadAvailability = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/events/scotia-2006/availability",
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error();
      const result = (await response.json()) as Availability;
      setAvailability(result);
      setAvailabilityState(result.state);
      setQuantity((current) =>
        Math.max(1, Math.min(current, result.maxPerOrder, result.remaining || 1)),
      );
    } catch {
      setAvailabilityState("paused");
    }
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (!sessionId && !checkoutCancelled) return;
    window.requestAnimationFrame(() => {
      ticketCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [checkoutCancelled, sessionId]);

  useEffect(() => {
    if (purchaseStep === "purchaser") {
      purchaserNameRef.current?.focus({ preventScroll: true });
    }
  }, [purchaseStep]);

  useEffect(() => {
    setGuestListRoot(document.getElementById("scotia-2006-guest-list"));
  }, []);

  useEffect(() => {
    if (dismissedReturnRef.current) return;
    if (sessionId) setConfirmationSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!confirmationSessionId) return;

    let stopped = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      try {
        const response = await fetch(
          `/api/events/scotia-2006/status?session_id=${encodeURIComponent(confirmationSessionId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error();
        const result = (await response.json()) as OrderStatus;
        if (stopped) return;

        setOrderStatus(result);
        if (result.state === "paid") {
          paidThisVisitRef.current = true;
          setStatusMessage("Payment confirmed. Your tickets are ready.");
          void loadAvailability();
          return;
        }
        if (
          result.state === "expired" ||
          result.state === "cancelled" ||
          result.state === "payment_failed"
        ) {
          setStatusMessage(
            "Payment was not completed. Your ticket reservation has been released.",
          );
          void loadAvailability();
          return;
        }

        attempts += 1;
        if (attempts < 15) {
          timer = setTimeout(verify, 2000);
        } else {
          setStatusMessage(
            "Payment is still being verified. Refresh this page in a moment.",
          );
        }
      } catch {
        if (!stopped) {
          setStatusMessage(
            "Payment status is temporarily unavailable. Refresh this page in a moment.",
          );
        }
      }
    };

    void verify();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [confirmationSessionId, loadAvailability]);

  const loadGuestList = useCallback(async (reportFailure: boolean) => {
    const requestId = guestRequestRef.current + 1;
    guestRequestRef.current = requestId;

    try {
      const response = await fetch("/api/events/scotia-2006/guest-list", {
        cache: "no-store",
      });
      if (requestId !== guestRequestRef.current) return;

      if (response.status === 401 || response.status === 403) {
        if (paidThisVisitRef.current) return;
        setGuestList(null);
        setGuestListError("");
        setBuyerState("public");
        return;
      }

      const result = readGuestList(await response.json());
      if (requestId !== guestRequestRef.current) return;
      if (!response.ok || !result) {
        if (reportFailure) {
          setGuestListError("Guest list is temporarily unavailable.");
        }
        setBuyerState((current) => (current === "buyer" ? current : "public"));
        return;
      }

      setGuestList(result);
      setGuestListError("");
      setBuyerState("buyer");
      if (!nameDirtyRef.current) {
        setNameDraft(result.guestListName || result.suggestedName);
      }
    } catch {
      if (requestId !== guestRequestRef.current) return;
      if (reportFailure) {
        setGuestListError("Guest list is temporarily unavailable.");
      }
      setBuyerState((current) => (current === "buyer" ? current : "public"));
    }
  }, []);

  useEffect(() => {
    void loadGuestList(false);
  }, [loadGuestList]);

  useEffect(() => {
    if (orderStatus?.state !== "paid") return;
    void loadGuestList(true);
  }, [loadGuestList, orderStatus?.state]);

  async function saveGuestList(next: { optedIn: boolean; guestListName: string }) {
    const guestListName = next.guestListName.trim();
    if (next.optedIn && !guestListName) {
      setGuestListError(
        "Add the name you want classmates to see before showing it.",
      );
      return;
    }

    setGuestListSaving(true);
    setGuestListError("");
    try {
      const response = await fetch("/api/events/scotia-2006/guest-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ optedIn: next.optedIn, guestListName }),
      });
      const result = readGuestList(await response.json());
      if (!response.ok || !result) throw new Error();
      setGuestList(result);
      setNameDraft(result.guestListName || result.suggestedName);
      nameDirtyRef.current = false;
      setNameDirty(false);
      setBuyerState("buyer");
    } catch {
      setGuestListError("Your guest list choice could not be saved.");
    } finally {
      setGuestListSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripePromise) {
      setFormError("Ticket checkout is not configured.");
      return;
    }
    setSubmitting(true);
    setFormError("");

    const form = new FormData(event.currentTarget);
    const requestId = requestIdRef.current ?? crypto.randomUUID();
    requestIdRef.current = requestId;

    try {
      const response = await fetch("/api/events/scotia-2006/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          quantity,
          purchaserName: form.get("purchaserName"),
          purchaserEmail: form.get("purchaserEmail"),
          graduationYear: form.get("graduationYear"),
          connectionNote: form.get("connectionNote"),
          marketingOptIn: form.get("marketingOptIn") === "on",
        }),
      });
      const result = (await response.json()) as {
        clientSecret?: string;
        sessionId?: string;
        error?: string;
      };

      if (!response.ok || !result.clientSecret || !result.sessionId) {
        requestIdRef.current = null;
        throw new Error(result.error ?? "Checkout could not be started");
      }

      setEmbeddedSessionId(result.sessionId);
      setClientSecret(result.clientSecret);
      setSubmitting(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Checkout could not be started",
      );
      setSubmitting(false);
      void loadAvailability();
    }
  }

  function buyMoreTickets() {
    dismissedReturnRef.current = true;
    setConfirmationSessionId(null);
    setClientSecret(null);
    setEmbeddedSessionId(null);
    setOrderStatus(null);
    setStatusMessage("");
    setPurchaseOpen(false);
    setPurchaseStep("quantity");
    setFormError("");
    requestIdRef.current = null;
  }

  function openPurchase() {
    setPurchaseOpen(true);
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      ticketCardRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      });
    });
  }

  const maximumQuantity = Math.max(
    1,
    Math.min(
      availability?.maxPerOrder ?? 8,
      availability?.remaining || 8,
    ),
  );
  const canBuy = availabilityState === "available";
  const unitAmountCents = availability?.unitAmountCents ?? 2006;
  const total = (quantity * unitAmountCents) / 100;
  const showPurchaseFlow = canBuy && !clientSecret && !confirmationSessionId;
  const showBuyerGuestList = buyerState === "buyer";
  const visibleGuestList = guestList ?? emptyGuestList;

  return (
    <>
    <div id="tickets" ref={ticketCardRef} className={styles.purchase}>
      {(statusMessage || orderStatus?.state === "paid") && (
        <div className={styles.statusPanel} aria-live="polite">
          {statusMessage && <p>{statusMessage}</p>}
          {orderStatus?.state === "paid" && (
            <div className={styles.verifiedTickets}>
              <strong>
                {orderStatus.quantity} ticket
                {orderStatus.quantity === 1 ? "" : "s"} confirmed
              </strong>
              <p>
                Ticket number{orderStatus.tickets.length === 1 ? "" : "s"}:{" "}
                {orderStatus.tickets.map((ticket) => ticket.number).join(", ")}
              </p>
              <button
                type="button"
                className={styles.continueButton}
                onClick={buyMoreTickets}
              >
                Buy more tickets
              </button>
            </div>
          )}
        </div>
      )}

      {availabilityState === "loading" && (
        <p className={styles.availability}>Checking ticket availability…</p>
      )}
      {availabilityState === "paused" && (
        <p className={styles.availability}>
          Ticket sales are not open right now.
        </p>
      )}
      {availabilityState === "held" && (
        <p className={styles.availability}>
          All remaining tickets are currently held in Checkout. Please check
          again soon.
        </p>
      )}
      {availabilityState === "sold_out" && (
        <p className={styles.availability}>Dinner tickets are sold out.</p>
      )}

      {showPurchaseFlow && !purchaseOpen && (
        <button
          type="button"
          className={styles.primaryAction}
          onClick={openPurchase}
        >
          Get Tickets
        </button>
      )}

      {showPurchaseFlow && purchaseOpen && purchaseStep === "quantity" && (
        <div className={styles.quantityStep}>
          <p className={styles.stepLabel}>Quantity</p>
          <div className={styles.quantityControl}>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              aria-label="Remove one ticket"
            >
              −
            </button>
            <output aria-live="polite">
              <strong>{quantity}</strong>
              <span>{quantity === 1 ? "ticket" : "tickets"}</span>
            </output>
            <button
              type="button"
              onClick={() =>
                setQuantity((current) =>
                  Math.min(maximumQuantity, current + 1),
                )
              }
              disabled={quantity >= maximumQuantity}
              aria-label="Add one ticket"
            >
              +
            </button>
          </div>
          <p className={styles.orderTotal}>
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </p>
          <button
            type="button"
            className={styles.continueButton}
            onClick={() => setPurchaseStep("purchaser")}
          >
            Continue
          </button>
        </div>
      )}

      {showPurchaseFlow && purchaseOpen && purchaseStep === "purchaser" && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.orderSummary}>
            <p>
              <strong>
                {quantity} ticket{quantity === 1 ? "" : "s"}
              </strong>
              <span>${total.toFixed(2)} total</span>
            </p>
            <button
              type="button"
              onClick={() => setPurchaseStep("quantity")}
              disabled={submitting}
            >
              Edit
            </button>
          </div>

          <label>
            Purchaser name
            <input
              ref={purchaserNameRef}
              name="purchaserName"
              autoComplete="name"
              maxLength={120}
              value={purchaserName}
              onChange={(event) => setPurchaserName(event.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <label>
            Email
            <input
              name="purchaserEmail"
              type="email"
              autoComplete="email"
              value={purchaserEmail}
              onChange={(event) => setPurchaserEmail(event.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <details className={styles.optionalFields}>
            <summary>Add graduation year or connection note</summary>
            <div>
              <label>
                Graduation year <span>(optional)</span>
                <input
                  name="graduationYear"
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2100}
                  value={graduationYear}
                  onChange={(event) => setGraduationYear(event.target.value)}
                  disabled={submitting}
                />
              </label>

              <label>
                Connection note <span>(optional)</span>
                <textarea
                  name="connectionNote"
                  rows={3}
                  maxLength={1000}
                  value={connectionNote}
                  onChange={(event) => setConnectionNote(event.target.value)}
                  disabled={submitting}
                />
              </label>
            </div>
          </details>

          <label className={styles.checkbox}>
            <input
              name="marketingOptIn"
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              disabled={submitting}
            />
            <span>
              Send me occasional Greenroad updates. Optional and off by
              default.
            </span>
          </label>

          {formError && (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className={styles.continueButton}
            disabled={submitting}
          >
            {submitting ? "Preparing payment…" : "Continue to payment"}
          </button>
        </form>
      )}

      {clientSecret && !confirmationSessionId && (
        stripePromise ? (
          <div className={styles.embeddedCheckout}>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret,
                onComplete: () => {
                  if (!embeddedSessionId) return;
                  setStatusMessage("Verifying your payment…");
                  setConfirmationSessionId(embeddedSessionId);
                },
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          <p className={styles.error} role="alert">
            Ticket checkout is not configured.
          </p>
        )
      )}

      {(showPurchaseFlow || clientSecret) && !confirmationSessionId && (
        <p className={styles.checkoutNote}>
          Payment stays on this page. No Greenroad account is required.
        </p>
      )}
    </div>
    {showBuyerGuestList && guestListRoot
      ? createPortal(
          <section className={styles.guestListSection} aria-labelledby="guest-list-heading">
            <h2 id="guest-list-heading">Guest List</h2>
            <label className={styles.guestName}>
              Name shown on guest list
              <input
                value={nameDraft}
                maxLength={120}
                disabled={guestListSaving || !guestList}
                onChange={(event) => {
                  setNameDraft(event.target.value);
                  nameDirtyRef.current = true;
                  setNameDirty(true);
                }}
                onBlur={() => {
                  if (!guestList || !nameDirty) return;
                  void saveGuestList({
                    optedIn: guestList.optedIn,
                    guestListName: nameDraft,
                  });
                }}
              />
            </label>
            <p className={styles.guestNameHint}>
              Add a graduation name or maiden name if you want classmates to
              know who you were and who you are now.
            </p>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={visibleGuestList.optedIn}
                disabled={guestListSaving || !guestList}
                onChange={(event) => {
                  void saveGuestList({
                    optedIn: event.target.checked,
                    guestListName: nameDraft,
                  });
                }}
              />
              Show my name on the guest list
            </label>
            {guestListError && <p className={styles.error}>{guestListError}</p>}
            {visibleGuestList.names.length === 0 ? (
              <p>No names shared yet.</p>
            ) : (
              <ul>
                {visibleGuestList.names.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            )}
          </section>,
          guestListRoot,
        )
      : null}
    </>
  );
}
