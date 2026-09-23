import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const REUNION_BUYER_COOKIE = "gr_scotia_2006_buyer";

export const reunionBuyerCookie = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export function isCheckoutSessionId(
  value: string | null | undefined,
): value is string {
  return Boolean(value && value.startsWith("cs_") && value.length <= 255);
}

export function readEventSlug(value: unknown): string | null {
  const record = Array.isArray(value) ? value[0] : value;
  if (!record || typeof record !== "object" || !("slug" in record)) {
    return null;
  }
  return typeof record.slug === "string" ? record.slug : null;
}

export interface PaidScotiaBuyer {
  id: string;
  purchaserName: string;
  guestListOptIn: boolean;
}

export async function findPaidScotiaBuyer(
  sessionId: string,
): Promise<
  | { buyer: PaidScotiaBuyer }
  | { error: "unavailable" | "not_buyer" }
> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("event_orders")
    .select(
      "id,status,purchaser_name,guest_list_opt_in,events!event_orders_event_id_fkey!inner(slug)",
    )
    .eq("stripe_checkout_session_id", sessionId)
    .eq("events.slug", "scotia-2006")
    .maybeSingle();

  if (error) return { error: "unavailable" };
  if (!data || data.status !== "paid") return { error: "not_buyer" };

  return {
    buyer: {
      id: data.id,
      purchaserName: data.purchaser_name,
      guestListOptIn: data.guest_list_opt_in,
    },
  };
}

export async function listOptedInGuestNames(): Promise<
  { names: string[] } | { error: "unavailable" }
> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("event_orders")
    .select(
      "purchaser_name,events!event_orders_event_id_fkey!inner(slug)",
    )
    .eq("status", "paid")
    .eq("guest_list_opt_in", true)
    .eq("events.slug", "scotia-2006")
    .order("purchaser_name");

  if (error) return { error: "unavailable" };

  return {
    names: (data ?? []).map((order) => order.purchaser_name),
  };
}
