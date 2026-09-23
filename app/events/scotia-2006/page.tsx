import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ReunionTicketForm } from "./ReunionTicketForm";
import styles from "./reunion.module.css";

const POSTER_PATH = "/events/scotia-2006/reunion-poster.jpg";

export const metadata: Metadata = {
  title: "SGHS Class of 2006 20-Year Reunion | Greenroad",
  description:
    "Reunion details and dinner tickets for Saturday, October 31, 2026.",
  openGraph: {
    title: "SGHS Class of 2006 20-Year Reunion",
    description:
      "Costume Kickball, Tartan Dinner, and live music on Saturday, October 31, 2026.",
    images: [
      {
        url: POSTER_PATH,
        width: 819,
        height: 1024,
        alt: "SGHS Class of 2006 20-Year Reunion poster",
      },
    ],
  },
};

export default function Scotia2006EventPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden>
        <div className={styles.backdropImage} />
        <div className={styles.backdropScrim} />
        <div className={styles.backdropTop} />
        <div className={styles.backdropBottom} />
      </div>

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Return to Greenroad">
          <Image
            src="/greenroadgrouplogo6326.png"
            alt=""
            width={52}
            height={52}
            className={styles.brandLogo}
            priority
          />
        </Link>
        <p className={styles.story}>
          We&apos;re discovering the Green Road together.
        </p>
        <span className={styles.community}>Community</span>
      </header>

      <div className={styles.shell}>
        <section className={styles.eventStage} aria-labelledby="event-title">
          <article className={styles.eventCard}>
            <div className={styles.tartanRibbon}>
              <span>Community Discovery</span>
              <span>Saturday · October 31 · 2026</span>
            </div>

            <div className={styles.heroMedia}>
              <Image
                src={POSTER_PATH}
                alt="SGHS Class of 2006 20-Year Reunion poster"
                width={819}
                height={1024}
                sizes="(max-width: 640px) calc(100vw - 1.25rem), 28rem"
                className={styles.heroImage}
                priority
              />
            </div>

            <div className={styles.eventBody}>
              <p className={styles.eyebrow}>Scotia-Glenville High School</p>
              <h1 id="event-title">Class of 2006 20-Year Reunion</h1>
              <p className={styles.eventIntro}>
                Costume Kickball, Tartan Dinner, and live music—open to
                Tartans.
              </p>

              <div className={styles.ticketCallout}>
                <p>
                  <span>Dinner ticket</span>
                  <strong>$20.06</strong>
                </p>
                <span>Tax included</span>
              </div>

              <Suspense
                fallback={
                  <p className={styles.availability}>
                    Checking ticket availability…
                  </p>
                }
              >
                <ReunionTicketForm />
              </Suspense>
            </div>
          </article>
        </section>

        <div id="scotia-2006-guest-list" />

        <section className={styles.details} aria-labelledby="details-heading">
          <p className={styles.sectionLabel}>Reunion World</p>
          <h2 id="details-heading">Event details</h2>

          <details>
            <summary>Costume Kickball</summary>
            <div>
              <p>
                <strong>Noon–4 PM · Collins Park</strong>
              </p>
              <p>
                Little League Majors Field. Free, all ages, and open to
                Tartans. Large inflatable costumes are encouraged.
              </p>
            </div>
          </details>

          <details>
            <summary>Tartan Dinner &amp; Music</summary>
            <div>
              <p>
                <strong>4–8 PM · music and DJ until 10 PM</strong>
              </p>
              <p>
                Beukendaal Temple
                <br />
                22 Schonowee Ave
                <br />
                Scotia, NY 12302
              </p>
            </div>
          </details>

          <details>
            <summary>Refunds and transfers</summary>
            <div>
              <p>
                Refunds and ticket transfers are handled manually. Contact{" "}
                <a href="mailto:hello@greenroad.group">
                  hello@greenroad.group
                </a>{" "}
                for help.
              </p>
            </div>
          </details>
        </section>

        <section className={styles.partners} aria-labelledby="partners-heading">
          <p className={styles.sectionLabel}>Hometown Partners</p>
          <h2 id="partners-heading">Support the reunion</h2>
          <p>
            Want to support the reunion? Become a Tartan Sponsor.
          </p>
          <a
            href="mailto:hello@greenroad.group?subject=SGHS%20Class%20of%202006%20Tartan%20Sponsor"
            className={styles.secondaryAction}
          >
            Become a Tartan Sponsor
          </a>
        </section>

        <footer className={styles.footer}>
          <p>Greenroad Group Holdings LLC is the merchant of record.</p>
          <Link href="/">Return to Greenroad</Link>
        </footer>
      </div>
    </main>
  );
}
