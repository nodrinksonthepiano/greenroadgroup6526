import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendReunionConfirmationEmail } from "@/lib/reunion-confirmation-email";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.livemode) {
    return NextResponse.json(
      { error: "Live Stripe events are not enabled for this flow" },
      { status: 400 },
    );
  }

  const handledTypes = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ]);

  if (!handledTypes.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (
    session.metadata?.greenroad_flow !== "reunion" ||
    session.metadata?.event_slug !== "scotia-2006"
  ) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (
    !session.metadata.order_id ||
    session.client_reference_id !== session.metadata.order_id
  ) {
    return NextResponse.json(
      { error: "Checkout Session order reference is invalid" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const paidEvent =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded";

  try {
    if (paidEvent) {
      if (session.amount_total == null || !session.currency) {
        throw new Error("Checkout Session is missing its amount");
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

      const { data, error } = await supabase.rpc("fulfill_paid_event_order", {
        p_stripe_event_id: event.id,
        p_event_type: event.type,
        p_livemode: event.livemode,
        p_stripe_checkout_session_id: session.id,
        p_stripe_payment_intent_id: paymentIntentId,
        p_stripe_customer_id: customerId,
        p_payment_status: session.payment_status,
        p_amount_total: session.amount_total,
        p_currency: session.currency,
      });

      const result = Array.isArray(data) ? data[0] : null;
      if (error || !result?.fulfilled_order_id) {
        throw new Error(error?.message ?? "Reunion webhook processing failed");
      }

      await sendReunionConfirmationEmail(String(result.fulfilled_order_id));

      return NextResponse.json({
        received: true,
        fulfilledOrderId: result.fulfilled_order_id,
        newlyPaid: result.newly_paid,
      });
    }

    const { data, error } = await supabase.rpc(
      "release_attached_event_order_reservation",
      {
        p_stripe_event_id: event.id,
        p_event_type: event.type,
        p_livemode: event.livemode,
        p_stripe_checkout_session_id: session.id,
        p_payment_status: session.payment_status,
      },
    );

    const result = Array.isArray(data) ? data[0] : null;
    if (error || !result?.released_order_id) {
      throw new Error(error?.message ?? "Reunion webhook processing failed");
    }

    return NextResponse.json({
      received: true,
      releasedOrderId: result.released_order_id,
      newlyReleased: result.newly_released,
    });
  } catch (error) {
    console.error("Stripe reunion webhook processing failed", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
