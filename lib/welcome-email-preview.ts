export interface WelcomeEmailPreview {
  subject: string;
  preheader: string;
  from: string;
  replyTo: string;
  text: string;
  html: string;
}

const FROM = "Greenroad Group <hello@updates.greenroad.group>";
const REPLY_TO = "hello@greenroad.group";

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

export function renderWelcomeEmailPreview(input: {
  firstName?: string | null;
  logoSrc?: string;
  frogSrc?: string;
  visitUrl?: string;
  unsubscribeUrl?: string;
}): WelcomeEmailPreview {
  const firstName = input.firstName?.trim() || null;
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const logoSrc = input.logoSrc ?? "/greenroadgrouplogo6326.png";
  const frogSrc = input.frogSrc ?? "/email/gribbit-frog.png";
  const visitUrl = input.visitUrl ?? "https://www.greenroad.group/";
  const unsubscribeUrl = input.unsubscribeUrl ?? "/unsubscribe";
  const subject = "Kind to your wallet and kind to the earth";
  const preheader = "Wouldn't it be nice to buy something once?";
  const ideal =
    "Wouldn't it be nice to buy something once? A cast iron pan, handed down to the next generation. That's the ideal.";
  const together = "Nobody's perfect. We're on the Green Road together.";
  const mission =
    "We share quality eco-friendly goods through fair trade, community, and kindness. You'll hear about discoveries, gatherings, and occasional updates.";
  const contribute = "Have something to contribute? Let us know.";
  const sellPrompt = "What do you want to sell?";
  const sellUrl =
    "mailto:hello@greenroad.group?subject=What%20I%20want%20to%20sell";
  const values =
    "Sustainability, fair trade, generosity, kindness, service, and community. Fair prices. Quality goods.";
  const gribbit = "Love it, want it, gribbit, got it.";

  const text = [
    greeting,
    "",
    subject,
    "",
    ideal,
    "",
    together,
    "",
    mission,
    "",
    contribute,
    sellPrompt,
    sellUrl,
    "",
    values,
    "",
    gribbit,
    "",
    "Visit Greenroad",
    visitUrl,
    "",
    "You can leave these updates whenever you want.",
    unsubscribeUrl,
    "",
    "Greenroad Group",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#1a4a2e;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#1a4a2e;">
      <tr>
        <td align="center" style="padding:24px 12px;background-color:#1a4a2e;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#f5f0e6;border:2px solid #c9a84c;">
            <tr>
              <td align="center" style="padding:28px 28px 0;background-color:#f5f0e6;">
                <img src="${escapeHtml(logoSrc)}" width="112" height="112" alt="Greenroad Group seal: a frog and a lion, sun rays, and a winding road." style="display:block;width:112px;height:112px;border:0;">
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;font-family:Georgia,'Times New Roman',serif;color:#1a4a2e;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2d6a4f;">Greenroad Group</p>
                <p style="margin:18px 0 0;font-size:18px;line-height:1.5;">${escapeHtml(greeting)}</p>
                <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;font-weight:normal;color:#1a4a2e;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a4a2e;">
                <p style="margin:0 0 14px;">${escapeHtml(ideal)}</p>
                <p style="margin:0 0 14px;">${escapeHtml(together)}</p>
                <p style="margin:0 0 14px;">${escapeHtml(mission)}</p>
                <p style="margin:0;">${escapeHtml(contribute)} <a href="${escapeHtml(sellUrl)}" style="color:#1a4a2e;text-decoration:underline;">${escapeHtml(sellPrompt)}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#2d6a4f;">
                ${escapeHtml(values)}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;font-style:italic;color:#1a4a2e;">
                ${escapeHtml(gribbit)}<img src="${escapeHtml(frogSrc)}" width="84" height="57" alt="" style="display:inline-block;vertical-align:middle;margin:0 0 2px 8px;border:0;width:84px;height:57px;">
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#c9a84c" style="background-color:#c9a84c;border:2px solid #c9a84c;">
                      <a href="${escapeHtml(visitUrl)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;color:#1a4a2e;text-decoration:none;">Visit Greenroad</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a4a2e;">
                You can leave these updates whenever you want.<br>
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#1a4a2e;text-decoration:underline;">Unsubscribe from Greenroad updates</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background-color:#1a4a2e;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;letter-spacing:0.08em;text-transform:uppercase;color:#f5f0e6;">
                Greenroad Group
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject,
    preheader,
    from: FROM,
    replyTo: REPLY_TO,
    text,
    html,
  };
}
