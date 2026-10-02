import type { Metadata } from "next";
import Link from "next/link";
import { findCommunitySubscriberByToken } from "@/lib/community-subscribers";
import { confirmCommunityUnsubscribe } from "./actions";
import styles from "./unsubscribe.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe | Greenroad",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; result?: string }>;
}) {
  const params = await searchParams;
  const result = params.result;

  if (result === "unsubscribed" || result === "already" || result === "invalid") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Greenroad Group</p>
          <h1 className={styles.title}>
            {result === "invalid"
              ? "This link is not valid"
              : result === "already"
                ? "Already unsubscribed"
                : "You're unsubscribed"}
          </h1>
          <p className={styles.copy}>
            {result === "invalid"
              ? "This unsubscribe link is not valid."
              : result === "already"
                ? "You're already unsubscribed from Greenroad updates."
                : "You're unsubscribed from Greenroad updates. Purchase confirmations are unchanged."}
          </p>
          <Link className={styles.back} href="/">
            Back to Greenroad
          </Link>
        </section>
      </main>
    );
  }

  const token = params.token?.trim() ?? "";
  let subscriber: { email: string; subscribed: boolean } | null = null;
  let unavailable = false;
  try {
    subscriber = token ? await findCommunitySubscriberByToken(token) : null;
  } catch {
    unavailable = true;
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Greenroad Group</p>
        <h1 className={styles.title}>
          {unavailable
            ? "Unsubscribe is unavailable"
            : subscriber?.subscribed
              ? "Unsubscribe from Greenroad updates?"
              : subscriber
                ? "Already unsubscribed"
                : "This link is not valid"}
        </h1>
        <p className={styles.copy}>
          {unavailable
            ? "Please try this link again in a moment."
            : subscriber?.subscribed
              ? `${subscriber.email} will stop receiving occasional Greenroad updates. Purchase confirmations are separate and will continue.`
              : subscriber
                ? "You're already unsubscribed from Greenroad updates."
                : "This unsubscribe link is not valid."}
        </p>
        {subscriber?.subscribed && (
          <form action={confirmCommunityUnsubscribe}>
            <input type="hidden" name="token" value={token} />
            <button className={styles.button} type="submit">
              Unsubscribe
            </button>
          </form>
        )}
        <Link className={styles.back} href="/">
          Back to Greenroad
        </Link>
      </section>
    </main>
  );
}
