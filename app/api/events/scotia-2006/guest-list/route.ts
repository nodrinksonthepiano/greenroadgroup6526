import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  findPaidScotiaBuyer,
  isCheckoutSessionId,
  listOptedInGuestNames,
  REUNION_BUYER_COOKIE,
} from "@/lib/reunion-buyer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function denied(status: 401 | 403) {
  return NextResponse.json(
    { error: "A confirmed purchase is required" },
    { status, headers: noStore },
  );
}

async function requireBuyer() {
  const sessionId = (await cookies()).get(REUNION_BUYER_COOKIE)?.value;
  if (!isCheckoutSessionId(sessionId)) return denied(401);

  const result = await findPaidScotiaBuyer(sessionId);
  if ("error" in result) {
    if (result.error === "unavailable") {
      return NextResponse.json(
        { error: "Guest list is temporarily unavailable" },
        { status: 503, headers: noStore },
      );
    }
    return denied(403);
  }

  return result.buyer;
}

export async function GET() {
  const buyer = await requireBuyer();
  if (buyer instanceof NextResponse) return buyer;

  const names = await listOptedInGuestNames();
  if ("error" in names) {
    return NextResponse.json(
      { error: "Guest list is temporarily unavailable" },
      { status: 503, headers: noStore },
    );
  }

  return NextResponse.json(
    { optedIn: buyer.guestListOptIn, names: names.names },
    { headers: noStore },
  );
}

export async function PATCH(request: Request) {
  const buyer = await requireBuyer();
  if (buyer instanceof NextResponse) return buyer;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A guest list choice is required" },
      { status: 400, headers: noStore },
    );
  }

  const optedIn =
    body &&
    typeof body === "object" &&
    "optedIn" in body &&
    typeof body.optedIn === "boolean"
      ? body.optedIn
      : null;
  if (optedIn === null) {
    return NextResponse.json(
      { error: "A guest list choice is required" },
      { status: 400, headers: noStore },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: updated, error } = await supabase
    .from("event_orders")
    .update({ guest_list_opt_in: optedIn })
    .eq("id", buyer.id)
    .eq("status", "paid")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Guest list choice could not be saved" },
      { status: 503, headers: noStore },
    );
  }

  const names = await listOptedInGuestNames();
  if ("error" in names) {
    return NextResponse.json(
      { error: "Guest list is temporarily unavailable" },
      { status: 503, headers: noStore },
    );
  }

  return NextResponse.json(
    { optedIn, names: names.names },
    { headers: noStore },
  );
}
