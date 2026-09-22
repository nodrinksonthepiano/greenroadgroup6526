import "server-only";

import { getResend } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export async function sendReunionConfirmationEmail(
  orderId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("event_orders")
    .select(
      "id,status,quantity,purchaser_name,purchaser_email,confirmation_email_status",
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Paid reunion order could not be loaded for email");
  }
  if (order.status !== "paid") {
    throw new Error("Reunion confirmation cannot be sent for an unpaid order");
  }
  if (order.confirmation_email_status === "sent") {
    return;
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from("event_tickets")
    .select("ticket_number")
    .eq("order_id", orderId)
    .order("sequence_in_order");

  if (ticketsError || !tickets || tickets.length !== order.quantity) {
    throw new Error("Reunion ticket rows are incomplete");
  }

  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL;
  if (!from || !replyTo) {
    throw new Error("Missing reunion email sender configuration");
  }

  const ticketNumbers = tickets.map((ticket) =>
    String(ticket.ticket_number),
  );
  const safeName = escapeHtml(order.purchaser_name);
  const safeReplyTo = escapeHtml(replyTo);
  const safeTicketNumbers = ticketNumbers.map(escapeHtml);
  const subject = "Your SGHS Class of 2006 reunion tickets";
  const text = [
    `Hi ${order.purchaser_name},`,
    "",
    `Your payment is confirmed for ${order.quantity} reunion dinner ticket${order.quantity === 1 ? "" : "s"}.`,
    `Ticket number${ticketNumbers.length === 1 ? "" : "s"}: ${ticketNumbers.join(", ")}`,
    "",
    "Saturday, October 31, 2026",
    "Costume Kickball: Noon–4 PM at Collins Park",
    "Tartan Dinner: 4–8 PM at Beukendaal Temple",
    "22 Schonowee Ave, Scotia, NY 12302",
    "Live music/DJ until 10 PM",
    "",
    `For refund or transfer help, contact ${replyTo}.`,
    "",
    "Greenroad Group Holdings LLC",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a4a2e;line-height:1.5">
      <p>Hi ${safeName},</p>
      <p>Your payment is confirmed for <strong>${order.quantity} reunion dinner ticket${order.quantity === 1 ? "" : "s"}</strong>.</p>
      <p><strong>Ticket number${safeTicketNumbers.length === 1 ? "" : "s"}:</strong> ${safeTicketNumbers.join(", ")}</p>
      <p>
        <strong>Saturday, October 31, 2026</strong><br>
        Costume Kickball: Noon–4 PM at Collins Park<br>
        Tartan Dinner: 4–8 PM at Beukendaal Temple<br>
        22 Schonowee Ave, Scotia, NY 12302<br>
        Live music/DJ until 10 PM
      </p>
      <p>For refund or transfer help, contact ${safeReplyTo}.</p>
      <p>Greenroad Group Holdings LLC</p>
    </div>
  `.trim();

  const { data, error } = await getResend().emails.send(
    {
      from,
      to: order.purchaser_email,
      replyTo,
      subject,
      text,
      html,
    },
    {
      idempotencyKey: `reunion-confirmation/${order.id}/v1`,
    },
  );

  if (error || !data?.id) {
    await supabase
      .from("event_orders")
      .update({ confirmation_email_status: "failed" })
      .eq("id", order.id)
      .neq("confirmation_email_status", "sent");
    throw new Error("Resend did not accept the reunion confirmation email");
  }

  const { error: updateError } = await supabase
    .from("event_orders")
    .update({
      confirmation_email_status: "sent",
      confirmation_email_id: data.id,
      confirmation_email_sent_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("confirmation_email_status", "sent");

  if (updateError) {
    throw new Error("Reunion confirmation email state could not be saved");
  }
}
