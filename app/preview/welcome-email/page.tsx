import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { renderWelcomeEmailPreview } from "@/lib/welcome-email-preview";
import styles from "./preview.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome email preview",
  robots: { index: false, follow: false },
};

export default async function WelcomeEmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const logoSrc = `http://${host}/greenroadgrouplogo6326.png`;
  const frogSrc = `http://${host}/email/gribbit-frog.png`;
  const named = renderWelcomeEmailPreview({
    firstName: params.name?.trim() || "Ada",
    logoSrc,
    frogSrc,
  });
  const unnamed = renderWelcomeEmailPreview({
    firstName: null,
    logoSrc,
    frogSrc,
  });

  return (
    <main className={styles.page}>
      <p className={styles.notice}>
        Local preview only. This page does not send email. Production returns
        404 here.
      </p>
      <PreviewCard label="With a first name" email={named} />
      <PreviewCard label="Without a first name" email={unnamed} />
    </main>
  );
}

function PreviewCard({
  label,
  email,
}: {
  label: string;
  email: ReturnType<typeof renderWelcomeEmailPreview>;
}) {
  return (
    <section className={styles.card}>
      <h1 className={styles.label}>{label}</h1>
      <dl className={styles.meta}>
        <div>
          <dt>From</dt>
          <dd>{email.from}</dd>
        </div>
        <div>
          <dt>Reply-To</dt>
          <dd>{email.replyTo}</dd>
        </div>
        <div>
          <dt>Subject</dt>
          <dd>{email.subject}</dd>
        </div>
        <div>
          <dt>Preheader</dt>
          <dd>{email.preheader}</dd>
        </div>
      </dl>
      <iframe
        className={styles.frame}
        title={`${label} welcome email`}
        srcDoc={email.html}
      />
    </section>
  );
}
