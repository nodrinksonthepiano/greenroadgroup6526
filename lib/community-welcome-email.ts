import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getResend } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { renderWelcomeEmailPreview } from "@/lib/welcome-email-preview";

const PUBLIC_SITE_FALLBACK = "https://www.greenroad.group";

export function communitySiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || PUBLIC_SITE_FALLBACK).replace(/\/$/, "");
}

export function newUnsubscribeToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashUnsubscribeToken(token) };
}

export function hashUnsubscribeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isUnsubscribeToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export async function sendCommunityWelcomeEmail(input: {
  subscriberId: string;
  email: string;
  firstName: string | null;
  token: string;
  idempotencyKey?: string;
}): Promise<void> {
  const site = communitySiteUrl();
  const unsubscribeUrl = `${site}/unsubscribe?token=${encodeURIComponent(input.token)}`;
  const oneClickUrl = `${site}/api/community/unsubscribe?token=${encodeURIComponent(input.token)}`;
  const welcome = renderWelcomeEmailPreview({
    firstName: input.firstName,
    logoSrc: `${site}/greenroadgrouplogo6326.png`,
    frogSrc: `${site}/email/gribbit-frog.png`,
    visitUrl: `${site}/`,
    unsubscribeUrl,
  });

  const supabase = getSupabaseAdmin();
  const idempotencyKey =
    input.idempotencyKey ?? `community-welcome/${input.subscriberId}/v1`;
  const { data, error } = await getResend().emails.send(
    {
      from: welcome.from,
      to: input.email,
      replyTo: welcome.replyTo,
      subject: welcome.subject,
      text: welcome.text,
      html: welcome.html,
      headers: {
        "List-Unsubscribe": `<${oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    },
    { idempotencyKey },
  );

  if (error || !data?.id) {
    await supabase
      .from("community_subscribers")
      .update({ welcome_email_status: "failed" })
      .eq("id", input.subscriberId)
      .neq("welcome_email_status", "sent");
    throw new Error("Resend did not accept the Greenroad welcome email");
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("community_subscribers")
    .update({
      welcome_email_status: "sent",
      welcome_email_id: data.id,
      welcome_email_sent_at: sentAt,
    })
    .eq("id", input.subscriberId)
    .neq("welcome_email_status", "sent");

  if (updateError) {
    throw new Error("Welcome email state could not be saved");
  }
}
