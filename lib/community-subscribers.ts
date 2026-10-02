import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sanitizeVisitUtm, type VisitUtm } from "@/lib/utm";
import {
  hashUnsubscribeToken,
  isUnsubscribeToken,
  newUnsubscribeToken,
  sendCommunityWelcomeEmail,
} from "@/lib/community-welcome-email";

export class CommunityInputError extends Error {}

export class CommunityDeliveryError extends Error {}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubscriberRow {
  id: string;
  email: string;
  first_name: string | null;
  subscribed: boolean;
  welcome_email_status: "pending" | "sent" | "failed" | "skipped";
}

export function parseCommunityEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new CommunityInputError("A valid email is required");
  }
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new CommunityInputError("A valid email is required");
  }
  return email;
}

export function parseCommunityFirstName(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new CommunityInputError("First name is invalid");
  }
  const firstName = value.trim().replace(/\s+/g, " ");
  if (!firstName) return null;
  if (firstName.length > 80 || /[\u0000-\u001F\u007F]/.test(firstName)) {
    throw new CommunityInputError("First name is invalid");
  }
  return firstName;
}

async function loadByEmail(email: string): Promise<SubscriberRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("community_subscribers")
    .select("id,email,first_name,subscribed,welcome_email_status")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error("Community subscriber could not be loaded");
  }
  return (data as SubscriberRow | null) ?? null;
}

async function deliverWelcome(
  row: SubscriberRow,
  token: string,
  idempotencyKey?: string,
): Promise<void> {
  try {
    await sendCommunityWelcomeEmail({
      subscriberId: row.id,
      email: row.email,
      firstName: row.first_name,
      token,
      idempotencyKey,
    });
  } catch (error) {
    console.error(
      "Community welcome email failed",
      error instanceof Error ? error.message : "unknown",
    );
    throw new CommunityDeliveryError(
      "We saved your signup, but the welcome note could not be sent. Please try again.",
    );
  }
}

async function rememberFirstName(
  row: SubscriberRow,
  firstName: string | null,
): Promise<void> {
  if (!firstName || row.first_name) return;
  const { error } = await getSupabaseAdmin()
    .from("community_subscribers")
    .update({ first_name: firstName })
    .eq("id", row.id)
    .is("first_name", null);
  if (error) {
    throw new Error("Community subscriber could not be updated");
  }
}

export async function joinCommunity(input: {
  email: unknown;
  firstName: unknown;
  utm: unknown;
}): Promise<{ state: "joined" | "already_subscribed" }> {
  const email = parseCommunityEmail(input.email);
  const firstName = parseCommunityFirstName(input.firstName);
  const utm: VisitUtm = sanitizeVisitUtm(input.utm);
  const existing = await loadByEmail(email);

  if (!existing) {
    const created = await insertSubscriber(email, firstName, utm);
    if (!created) {
      const raced = await loadByEmail(email);
      if (!raced) throw new Error("Community subscriber could not be saved");
      return finishExisting(raced, firstName);
    }
    await deliverWelcome(created.row, created.token);
    return { state: "joined" };
  }

  return finishExisting(existing, firstName);
}

async function finishExisting(
  existing: SubscriberRow,
  firstName: string | null,
  attempt = 0,
): Promise<{ state: "joined" | "already_subscribed" }> {
  if (attempt > 1) {
    throw new Error("Community subscriber could not be saved");
  }

  if (!existing.subscribed) {
    const token = newUnsubscribeToken();
    const { data, error } = await getSupabaseAdmin()
      .from("community_subscribers")
      .update({
        subscribed: true,
        unsubscribed_at: null,
        consented_at: new Date().toISOString(),
        first_name: firstName ?? existing.first_name,
        welcome_email_status: "pending",
        welcome_email_id: null,
        welcome_email_sent_at: null,
        unsubscribe_token_hash: token.hash,
      })
      .eq("id", existing.id)
      .eq("subscribed", false)
      .select("id,email,first_name,subscribed,welcome_email_status")
      .maybeSingle();

    if (error) {
      throw new Error("Community subscriber could not be saved");
    }
    if (!data) {
      const current = await loadByEmail(existing.email);
      if (!current) throw new Error("Community subscriber could not be saved");
      return finishExisting(current, firstName, attempt + 1);
    }

    await deliverWelcome(
      data as SubscriberRow,
      token.token,
      `community-welcome/${existing.id}/v2`,
    );
    return { state: "joined" };
  }

  if (
    existing.welcome_email_status === "sent" ||
    existing.welcome_email_status === "skipped"
  ) {
    await rememberFirstName(existing, firstName);
    return { state: "already_subscribed" };
  }

  const token = newUnsubscribeToken();
  const { data, error } = await getSupabaseAdmin()
    .from("community_subscribers")
    .update({
      first_name: firstName ?? existing.first_name,
      welcome_email_status: "pending",
      unsubscribe_token_hash: token.hash,
    })
    .eq("id", existing.id)
    .eq("subscribed", true)
    .in("welcome_email_status", ["pending", "failed"])
    .select("id,email,first_name,subscribed,welcome_email_status")
    .maybeSingle();

  if (error) {
    throw new Error("Community subscriber could not be saved");
  }
  if (!data) {
    const current = await loadByEmail(existing.email);
    if (!current) throw new Error("Community subscriber could not be saved");
    return finishExisting(current, firstName, attempt + 1);
  }

  await deliverWelcome(data as SubscriberRow, token.token);
  return { state: "joined" };
}

async function insertSubscriber(
  email: string,
  firstName: string | null,
  utm: VisitUtm,
): Promise<{ row: SubscriberRow; token: string } | null> {
  const token = newUnsubscribeToken();
  const { data, error } = await getSupabaseAdmin()
    .from("community_subscribers")
    .insert({
      email,
      first_name: firstName,
      subscribed: true,
      consented_at: new Date().toISOString(),
      source: "homepage_join",
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      welcome_email_status: "pending",
      unsubscribe_token_hash: token.hash,
    })
    .select("id,email,first_name,subscribed,welcome_email_status")
    .single();

  if (error?.code === "23505") return null;
  if (error || !data) {
    throw new Error("Community subscriber could not be saved");
  }
  return { row: data as SubscriberRow, token: token.token };
}

export async function findCommunitySubscriberByToken(
  token: string,
): Promise<{ email: string; subscribed: boolean } | null> {
  if (!isUnsubscribeToken(token)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("community_subscribers")
    .select("email,subscribed")
    .eq("unsubscribe_token_hash", hashUnsubscribeToken(token))
    .maybeSingle();

  if (error) {
    throw new Error("Community subscriber could not be loaded");
  }
  if (!data?.email || typeof data.subscribed !== "boolean") return null;
  return { email: data.email, subscribed: data.subscribed };
}

export async function unsubscribeCommunity(
  token: string,
): Promise<"unsubscribed" | "already" | "invalid"> {
  if (!isUnsubscribeToken(token)) return "invalid";
  const hash = hashUnsubscribeToken(token);
  const found = await findCommunitySubscriberByToken(token);
  if (!found) return "invalid";
  if (!found.subscribed) return "already";

  const { data, error } = await getSupabaseAdmin()
    .from("community_subscribers")
    .update({
      subscribed: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token_hash", hash)
    .eq("subscribed", true)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("Community unsubscribe could not be saved");
  }
  if (!data) {
    const current = await findCommunitySubscriberByToken(token);
    if (current && !current.subscribed) return "already";
    return "invalid";
  }
  return "unsubscribed";
}
