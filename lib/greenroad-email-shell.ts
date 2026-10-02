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

function safeHttpUrl(href: string): string {
  const url = new URL(href);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Email link must use http or https");
  }
  return url.toString();
}

export interface GreenroadEmailAction {
  href: string;
  label: string;
}

export interface GreenroadEmailContent {
  preheader: string;
  eyebrow: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  action?: GreenroadEmailAction;
  footerNote: string;
  unsubscribe?: GreenroadEmailAction;
}

export function renderGreenroadEmail(content: GreenroadEmailContent): string {
  const action = content.action
    ? `<tr>
                  <td align="center" style="padding:28px 28px 8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#c9a84c" style="background-color:#c9a84c;border:2px solid #c9a84c;">
                          <a href="${escapeHtml(safeHttpUrl(content.action.href))}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;color:#1a4a2e;text-decoration:none;">${escapeHtml(content.action.label)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
    : "";

  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a4a2e;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const unsubscribe = content.unsubscribe
    ? `<tr>
                  <td style="padding:0 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a4a2e;">
                    <a href="${escapeHtml(safeHttpUrl(content.unsubscribe.href))}" style="color:#1a4a2e;text-decoration:underline;">${escapeHtml(content.unsubscribe.label)}</a>
                  </td>
                </tr>`
    : "";

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(content.title)}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#1a4a2e;">
        <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
          ${escapeHtml(content.preheader)}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#1a4a2e;">
          <tr>
            <td align="center" style="padding:24px 12px;background-color:#1a4a2e;">
              <!--[if mso]>
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td>
              <![endif]-->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#f5f0e6;border:2px solid #c9a84c;">
                <tr>
                  <td style="padding:28px 28px 0;font-family:Georgia,'Times New Roman',serif;color:#1a4a2e;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2d6a4f;">${escapeHtml(content.eyebrow)}</p>
                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.25;font-weight:normal;color:#1a4a2e;">${escapeHtml(content.title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a4a2e;">
                    ${escapeHtml(content.greeting)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 0;">
                    ${paragraphs}
                  </td>
                </tr>
                ${action}
                ${unsubscribe}
                <tr>
                  <td style="padding:16px 28px;background-color:#1a4a2e;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#f5f0e6;">
                    ${escapeHtml(content.footerNote)}
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
    </html>`.trim();
}
