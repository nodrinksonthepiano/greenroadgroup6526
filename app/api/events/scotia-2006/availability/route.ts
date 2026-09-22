import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,status,unit_amount_cents,currency")
    .eq("slug", "scotia-2006")
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Reunion ticket information is unavailable" },
      { status: 503 },
    );
  }

  const { data: batch, error: batchError } = await supabase
    .from("event_ticket_batches")
    .select(
      "status,capacity,max_per_order,reserved_count,sold_count,batch_number",
    )
    .eq("event_id", event.id)
    .eq("status", "open")
    .order("batch_number")
    .limit(1)
    .maybeSingle();

  if (batchError) {
    return NextResponse.json(
      { error: "Reunion ticket information is unavailable" },
      { status: 503 },
    );
  }

  let state: "available" | "paused" | "held" | "sold_out" = "paused";
  let remaining = 0;

  if (event.status === "open" && batch) {
    remaining = Math.max(
      0,
      batch.capacity - batch.reserved_count - batch.sold_count,
    );
    if (remaining > 0) {
      state = "available";
    } else if (batch.sold_count >= batch.capacity) {
      state = "sold_out";
    } else {
      state = "held";
    }
  }

  return NextResponse.json(
    {
      state,
      remaining,
      maxPerOrder: batch?.max_per_order ?? 8,
      unitAmountCents: event.unit_amount_cents,
      currency: event.currency,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
