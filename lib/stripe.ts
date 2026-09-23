import "server-only";

import Stripe from "stripe";

/**
 * STRIPE_SECRET_KEY selects the mode. A test key stays in sandbox.
 * A live key is used only when that environment variable is a live key.
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
