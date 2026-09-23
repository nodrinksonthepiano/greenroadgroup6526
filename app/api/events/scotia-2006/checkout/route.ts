import { NextResponse } from "next/server";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

interface CheckoutRequest {
  requestId?: unknown;
  quantity?: unknown;
  purchaserName?: unknown;
  purchaserEmail?: unknown;
  graduationYear?: unknown;
  connectionNote?: unknown;
  marketingOptIn?: unknown;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseRequest(body: CheckoutRequest) {
  const requestId =
    typeof body.requestId === "string" ? body.requestId.trim() : "";
  const quantity =
    typeof body.quantity === "number" ? body.quantity : Number.NaN;
  const purchaserName =
    typeof body.purchaserName === "string" ? body.purchaserName.trim() : "";
  const purchaserEmail =
    typeof body.purchaserEmail === "string"
      ? body.purchaserEmail.trim().toLowerCase()
      : "";
  const graduationYear =
    body.graduationYear === "" || body.graduationYear == null
      ? null
      : Number(body.graduationYear);
  const connectionNote =
    typeof body.connectionNote === "string"
      ? body.connectionNote.trim() || null
      : null;
  const marketingOptIn = body.marketingOptIn === true;

  if (!UUID_PATTERN.test(requestId)) {
    throw new Error("A valid checkout request id is required");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 8) {
    throw new Error("Choose between 1 and 8 tickets");
  }
  if (!purchaserName || purchaserName.length > 120) {
    throw new Error("Purchaser name is required");
  }
  if (
    purchaserEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaserEmail)
  ) {
    throw new Error("A valid purchaser email is required");
  }
  if (
    graduationYear !== null &&
    (!Number.isInteger(graduationYear) ||
      graduationYear < 1900 ||
      graduationYear > 2100)
  ) {
    throw new Error("Graduation year is invalid");
  }
  if (connectionNote && connectionNote.length > 1000) {
    throw new Error("Connection note is too long");
  }

  return {
    requestId,
    quantity,
    purchaserName,
    purchaserEmail,
    graduationYear,
    connectionNote,
    marketingOptIn,
  };
}

export async function POST(request: Request) {
  let input: ReturnType<typeof parseRequest>;
  try {
    input = parseRequest((await request.json()) as CheckoutRequest);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }

  const priceId = process.env.STRIPE_REUNION_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Ticket checkout is not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  try {
    const price = await stripe.prices.retrieve(priceId);
    if (
      !price.active ||
      price.currency !== "usd" ||
      price.unit_amount !== 2006 ||
      price.type !== "one_time" ||
      price.tax_behavior !== "inclusive"
    ) {
      throw new Error("Configured reunion Price does not match $20.06 USD");
    }
  } catch (error) {
    console.error("Reunion Price validation failed", error);
    return NextResponse.json(
      { error: "Ticket checkout is temporarily unavailable" },
      { status: 503 },
    );
  }

  const { data: reservationRows, error: reservationError } = await supabase.rpc(
    "reserve_event_order",
    {
      p_event_slug: "scotia-2006",
      p_request_id: input.requestId,
      p_quantity: input.quantity,
      p_purchaser_name: input.purchaserName,
      p_purchaser_email: input.purchaserEmail,
      p_graduation_year: input.graduationYear,
      p_connection_note: input.connectionNote,
      p_marketing_opt_in: input.marketingOptIn,
    },
  );

  const reservation = Array.isArray(reservationRows)
    ? reservationRows[0]
    : null;
  if (reservationError || !reservation?.reserved_order_id) {
    console.error("Reunion reservation failed", reservationError);
    return NextResponse.json(
      {
        error:
          reservationError?.message ??
          "Tickets could not be reserved. Please try again.",
      },
      { status: 409 },
    );
  }

  const orderId = String(reservation.reserved_order_id);

  const { data: existingOrder } = await supabase
    .from("event_orders")
    .select("stripe_checkout_session_id")
    .eq("id", orderId)
    .single();

  if (existingOrder?.stripe_checkout_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingOrder.stripe_checkout_session_id,
      );
      if (
        existingSession.status === "open" &&
        existingSession.ui_mode === "embedded_page" &&
        existingSession.client_secret
      ) {
        return NextResponse.json({
          clientSecret: existingSession.client_secret,
          sessionId: existingSession.id,
        });
      }
      if (existingSession.status === "open") {
        return NextResponse.json(
          {
            error:
              "This ticket hold is still on the previous checkout page. It will release when that checkout expires.",
          },
          { status: 409 },
        );
      }
    } catch (error) {
      console.error("Existing reunion Checkout Session lookup failed", error);
    }
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        ui_mode: "embedded_page",
        redirect_on_completion: "if_required",
        adaptive_pricing: { enabled: false },
        automatic_tax: { enabled: false },
        client_reference_id: orderId,
        customer_email: input.purchaserEmail,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        integration_identifier: "greenroad_reunion_qxjvtmzr",
        line_items: [{ price: priceId, quantity: input.quantity }],
        metadata: {
          greenroad_flow: "reunion",
          event_slug: "scotia-2006",
          order_id: orderId,
        },
        payment_intent_data: {
          metadata: {
            greenroad_flow: "reunion",
            event_slug: "scotia-2006",
            order_id: orderId,
          },
        },
        return_url: `${getSiteUrl()}/events/scotia-2006?session_id={CHECKOUT_SESSION_ID}`,
      },
      {
        idempotencyKey: `reunion-checkout-embedded/${orderId}`,
      },
    );
  } catch (error) {
    console.error("Reunion Checkout Session creation failed", error);
    await supabase.rpc("release_event_order_reservation", {
      p_order_id: orderId,
      p_reason: "cancelled",
    });
    return NextResponse.json(
      { error: "Stripe Checkout could not be started" },
      { status: 502 },
    );
  }

  const { error: attachError } = await supabase.rpc(
    "attach_stripe_checkout_session",
    {
      p_order_id: orderId,
      p_stripe_checkout_session_id: session.id,
      p_session_expires_at: new Date(session.expires_at * 1000).toISOString(),
    },
  );

  if (attachError || !session.client_secret) {
    console.error("Reunion Checkout Session attachment failed", attachError);
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (error) {
      console.error("Orphaned reunion Checkout Session could not expire", error);
    }
    await supabase.rpc("release_event_order_reservation", {
      p_order_id: orderId,
      p_reason: "cancelled",
    });
    return NextResponse.json(
      { error: "Ticket checkout could not be finalized" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    clientSecret: session.client_secret,
    sessionId: session.id,
  });
}
