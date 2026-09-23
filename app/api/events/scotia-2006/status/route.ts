import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  readEventSlug,
  REUNION_BUYER_COOKIE,
  reunionBuyerCookie,
} from "@/lib/reunion-buyer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId || !sessionId.startsWith("cs_") || sessionId.length > 255) {
    return NextResponse.json(
      { error: "A valid Checkout Session is required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("event_orders")
    .select(
      "id,status,quantity,confirmation_email_status,events!event_orders_event_id_fkey(slug)",
    )
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json(
      { error: "Ticket status is temporarily unavailable" },
      { status: 503 },
    );
  }
  if (!order) {
    return NextResponse.json(
      { state: "pending", quantity: null, tickets: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (order.status !== "paid") {
    return NextResponse.json(
      {
        state:
          order.status === "expired" ||
          order.status === "cancelled" ||
          order.status === "payment_failed"
            ? order.status
            : "pending",
        quantity: order.quantity,
        tickets: [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from("event_tickets")
    .select("ticket_number,status")
    .eq("order_id", order.id)
    .order("sequence_in_order");

  if (ticketsError) {
    return NextResponse.json(
      { error: "Ticket status is temporarily unavailable" },
      { status: 503 },
    );
  }

  const response = NextResponse.json(
    {
      state: "paid",
      quantity: order.quantity,
      emailStatus: order.confirmation_email_status,
      tickets: (tickets ?? []).map((ticket) => ({
        number: String(ticket.ticket_number),
        status: ticket.status,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  if (readEventSlug(order.events) === "scotia-2006") {
    response.cookies.set(REUNION_BUYER_COOKIE, sessionId, reunionBuyerCookie);
  }

  return response;
}
