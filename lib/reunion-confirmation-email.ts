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
  const safeTicketNumbers = ticketNumbers.map(escapeHtml);
  const ticketLabel =
    order.quantity === 1 ? "reunion dinner ticket" : "reunion dinner tickets";
  const numberLabel = ticketNumbers.length === 1 ? "Ticket number" : "Ticket numbers";
  const reunionUrl = "https://www.greenroad.group/events/scotia-2006";
  const helpEmail = "hello@greenroad.group";
  const subject = "Your SGHS Class of 2006 reunion tickets";
  const text = [
    `Hi ${order.purchaser_name},`,
    "",
    "Greenroad Group",
    "SGHS Class of 2006 — 20-Year Reunion",
    "",
    "Payment confirmed",
    `${order.quantity} ${ticketLabel}`,
    `${numberLabel}: ${ticketNumbers.join(", ")}`,
    "",
    "Saturday, October 31, 2026",
    "Costume Kickball: Noon–4 PM, Collins Park",
    "Tartan Dinner: 4–8 PM, Beukendaal Temple",
    "22 Schonowee Ave, Scotia, NY 12302",
    "Live Music & DJ until 10 PM",
    "",
    "View Reunion Page",
    reunionUrl,
    "",
    `For refund or transfer help, contact ${helpEmail}.`,
    "",
    "Greenroad Group",
  ].join("\n");
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>SGHS Class of 2006 — 20-Year Reunion</title>
      </head>
      <body style="margin:0;padding:0;background-color:#1a4a2e;">
        <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
          Payment confirmed for your SGHS Class of 2006 reunion tickets.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#1a4a2e;">
          <tr>
            <td align="center" style="padding:24px 12px;background-color:#1a4a2e;">
              <!--[if mso]>
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td>
              <![endif]-->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#f5f0e6;border:2px solid #c9a84c;">
                <tr>
                  <td style="height:10px;background-color:#8b1a2a;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 0;font-family:Georgia,'Times New Roman',serif;color:#1a4a2e;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2d6a4f;">Greenroad Group</p>
                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.25;font-weight:normal;color:#1a4a2e;">SGHS Class of 2006 — 20-Year Reunion</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a4a2e;">
                    Hi ${safeName},
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#fffdf8;border:1px solid #c9a84c;border-left:6px solid #8b1a2a;">
                      <tr>
                        <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a4a2e;">
                          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8b1a2a;">Payment confirmed</p>
                          <p style="margin:0 0 6px;"><strong>${order.quantity}</strong> ${ticketLabel}</p>
                          <p style="margin:0;"><strong>${numberLabel}:</strong> ${safeTicketNumbers.join(", ")}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 28px 0;">
                    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#2d6a4f;">Event details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid #c9a84c;">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #c9a84c;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a4a2e;">
                          <strong>Saturday, October 31, 2026</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #c9a84c;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a4a2e;">
                          Costume Kickball: Noon–4 PM, Collins Park
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #c9a84c;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a4a2e;">
                          Tartan Dinner: 4–8 PM, Beukendaal Temple
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #c9a84c;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a4a2e;">
                          22 Schonowee Ave, Scotia, NY 12302
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a4a2e;">
                          Live Music &amp; DJ until 10 PM
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:28px 28px 8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#c9a84c" style="background-color:#c9a84c;border:2px solid #c9a84c;">
                          <a href="${reunionUrl}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;color:#1a4a2e;text-decoration:none;">View Reunion Page</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a4a2e;">
                    For refund or transfer help, contact <a href="mailto:${helpEmail}" style="color:#8b1a2a;text-decoration:underline;">${helpEmail}</a>.
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px;background-color:#1a4a2e;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;letter-spacing:0.08em;text-transform:uppercase;color:#f5f0e6;">
                    Greenroad Group
                  </td>
                </tr>
              </table>
              <!--[if mso]>
              </td></tr></table>
              <![endif]-->
            </td>
          </tr>
        </table>
      </body>
    </html>
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
