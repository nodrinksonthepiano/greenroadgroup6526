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

function greenroadVisitUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Email link must use http or https");
  }
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${url.host}${path}${url.search}`;
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
  const visitUrl = greenroadVisitUrl(
    input.visitUrl ?? "https://www.greenroad.group/",
  );
  const unsubscribeUrl = input.unsubscribeUrl ?? "/unsubscribe";
  const subject = "You're on the Green Road";
  const here = "You're on the Green Road.";
  const glad = "We're glad you're here.";
  const choices =
    "We're gathering and guiding better everyday choices — kind to your wallet, kind to the earth, one replacement at a time.";
  const together = "Nobody's perfect. We're on the Green Road together.";
  const signoff = "Greenroad Group";
  const visitLabel = `Visit Greenroad: ${visitUrl}`;
  const unsubscribeLabel = "Unsubscribe";

  const text = [
    greeting,
    "",
    here,
    "",
    glad,
    "",
    choices,
    "",
    together,
    "",
    signoff,
    "",
    visitLabel,
    "",
    unsubscribeLabel,
    unsubscribeUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:24px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a4a2e;">
    <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;">${escapeHtml(here)}</p>
    <p style="margin:0 0 16px;">${escapeHtml(glad)}</p>
    <p style="margin:0 0 16px;">${escapeHtml(choices)}</p>
    <p style="margin:0 0 16px;">${escapeHtml(together)}</p>
    <p style="margin:0 0 16px;">${escapeHtml(signoff)}</p>
    <p style="margin:0 0 16px;">Visit Greenroad: <a href="${escapeHtml(visitUrl)}" style="color:#1a4a2e;text-decoration:underline;">${escapeHtml(visitUrl)}</a></p>
    <p style="margin:0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#1a4a2e;text-decoration:underline;">${escapeHtml(unsubscribeLabel)}</a></p>
  </body>
</html>`;

  return {
    subject,
    preheader: "",
    from: FROM,
    replyTo: REPLY_TO,
    text,
    html,
  };
}
