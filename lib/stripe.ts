import "server-only";

import Stripe from "stripe";

/**
 * Phase 2 is sandbox-only. Live keys are rejected until Jai explicitly
 * authorizes the live launch switch.
 */
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (key.startsWith("pk_")) {
    throw new Error("STRIPE_SECRET_KEY must be a secret or restricted key, not a publishable key");
  }
  if (key.includes("_live_")) {
    throw new Error("Live Stripe keys are disabled for reunion Phase 2");
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
