# Agent Notes

## Read first

Read `GREENROAD_MEMORY_MAP.md` before suggesting or making changes.

Greenroad = better goods + greener systems + custom goods.

Sustainability is the north star. Custom goods are the money-now lane, not the whole identity. The existing Greenroad Google Sheet is the control board.

ZEYODA is internal-only parent/foundation memory. The word ZEYODA should not appear in public Greenroad copy, customer-facing UI, SEO text, product pages, or marketing language unless Jai explicitly approves.

GOSHBOT routes memory and warns about drift.

## Session discipline

Begin every build session with:

> We are building one thing today. When it is complete we stop. Do not add anything I didn't ask for.

**One session = one scope.** Stop when done. Do not start the next session unless Jai says so.

### Current state — Reunion World presentation

The SGHS Class of 2006 reunion is the only approved Stripe exception.

Canonical public facts match the current poster: Costume Kickball noon–4 PM
at Collins Park, Little League Majors Field; Tartan Dinner 4–8 PM at
Beukendaal Temple, 22 Schonowee Ave, Scotia, NY 12302; live music and DJ
until 10 PM; dinner tickets $20.06, tax included. Never show a public
inventory count or “only 80 tickets.”

Reunion World presentation at `/events/scotia-2006` is authorized. Do not
edit payment, webhook, Supabase, migration, or email code. Do not assume
live sales are open. Custom Goods remains inquiry-only. Do not touch Custom
Goods carousel physics.

## Git

**Jai handles all git manually.** Agent does not run git status, checkout, branch, switch, pull, merge, rebase, reset, add, commit, or push unless Jai explicitly asks. Do not read or touch `.env` / `.env.local`.

## Current state (July 6, 2026)

```text
Branch:            main (Jai manages commits)
Custom Goods:      LIVE — Custom orbit + Custom Goods Station + swipe carousel
Backdrop:          LIVE — forest/sky room-backdrop per ecosystem
Quote CTA:         hello@greenroad.group
Logo:              Wired in GreenroadWallet / header area
ADG starter items: 7 in Custom carousel (not full ADG catalog)
Checkout/proof:    NOT live — inquiry mailto only
published field:   Does NOT gate UI
Reunion route:     /events/scotia-2006 presentation exists. Payment machinery is frozen. This is not proof that live sales are open.
```

**Do not use** `experiment/pearl-print-surface` as the active branch. Pearl/olive is merged to main. That experiment branch is historical.

**Read first:** `GREENROAD_MEMORY_MAP.md`, then `GREENROAD_MEMORY.md`

**Next UX priority:** print legibility over room-backdrop — accordion triggers and Continue Exploring headings wash out on light/misty photo areas. Fix with pearl reading surfaces or local scrims per material system. No gold body text on pearl.

---

## Reunion decisions locked (September 21, 2026)

- First real Community discovery: SGHS Class of 2006 reunion
- Permanent route: `/events/scotia-2006`
- Saturday, October 31, 2026; `America/New_York`
- Costume Kickball: Collins Park, Little League Majors Field, noon–4 PM,
  free, all ages, open to Tartans; large inflatable costumes encouraged
- Tartan Dinner: Beukendaal Temple, 22 Schonowee Ave, Scotia, NY 12302,
  4–8 PM; live music and DJ until 10 PM
- Current public artwork is `public/events/scotia-2006/reunion-poster.jpg`.
  Logos printed into the poster may show with the artwork. Hometown Partners
  stays logo-free until Jai approves those businesses as web sponsors.
  Replace the file when Jai supplies a newer poster
- Never show a public inventory count or “only 80 tickets”
- Do not invent missing public copy
- $20.06 total per dinner ticket, tax included; never add tax on top
- Batch 1 capacity 80; `max_per_order = 8` stored as batch configuration
- Buyer-facing Stripe Checkout duration is 30 minutes
- Initial pre-Stripe database hold is 35 minutes for creation/crash safety
- Session attachment shortens the database hold to Stripe's actual expiration
  and can never extend the provisional hold
- Expired unattached holds may be cleaned up; attached holds require later
  verified Stripe lifecycle processing and never release from a cancel redirect
- Never auto-create or auto-open a later batch
- Purchaser name/email required; no per-attendee names or QR system in V1
- One ticket row/number per paid ticket
- Merchant of record: Greenroad Group Holdings LLC
- Stripe-hosted Checkout; webhook + Greenroad database are payment truth
- Return success/cancel state to `/events/scotia-2006`; query state is not proof
- Resend sender planned as `Greenroad Group <tickets@updates.greenroad.group>`;
  reply-to `hello@greenroad.group`; verification is a later setup step
- New York sales-tax registration exists and Stripe Tax is enabled, but ticket
  classification and live Stripe Tax registration still require verification
  before live payments
- Supabase SQL may be created for review but never applied without explicit
  authorization
- Current Batch 1 capacity SQL test is sequential. Run a real two-session
  reservation concurrency test against the sandbox database before launch.

The reunion exception does not authorize generic checkout, Custom Goods
checkout, invoices, Terminal/POS, subscriptions, or ArtisTalks reuse.

---

## Session 1 complete (2026-06-05)

Created:
- Next.js 15 scaffold (`greenroadgroup6526`)
- Design tokens + color system (`app/styles/tokens.css`)
- Fonts: Cormorant Garamond + Inter (`app/layout.tsx`)
- Folder structure: `data/discoveries`, `data/suppliers`, `data/rooms/*`
- Memory docs: VOICE_AND_VISION, GREENROAD_KNOWLEDGE_BASE, PRD.json, LAUNCH_ROADMAP, SESSION_REPORT
- Empty page (no UI — Session 1 spec)

## Session 2 complete (2026-06-05)

Created:
- `data/types/discovery.ts` — Discovery + Supplier types
- `data/discoveries/desk-plants-mini-harlow.json` — first discovery
- `data/suppliers/desk-plants.json` — supplier record
- `data/index.ts` — typed loader for Session 3+

## Session 3 complete (2026-06-05)

Built homepage-as-discovery at `/`:
- Story banner, wallet top-left, featured Desk Plants, ecosystem orbit, six accordions, Continue Exploring, command search shell
- All context from `desk-plants-mini-harlow.json`

## Session 3A complete (2026-06-05)

Experience pass: hero image, orbit wraps discovery, search, coming into view, join focus.

## Header polish complete (`13df07d`)

Header layering and featured discovery copy refinements.

## Pearl/olive material system complete (`4cf6e9e`)

Merged to main:
- `--print-pearl`, `--print-olive`, `--ink` tokens in `tokens.css`
- Pearl reading surfaces on featured body and accordion panels
- Olive on ecosystem badge, signal cards, Continue Exploring cards
- Gold trim on frames and buttons; forest world unchanged

**Priority 1 (reading surface) — DONE.**

## Doc sync complete (`fbca51d`)

Memory docs synced: `GREENROAD_MEMORY.md`, knowledge base, PRD, roadmap, session report.

## Priority 2A complete (`1fa3cb4`)

- Orbit speed calm (`ORBIT_SPEED` 0.09)
- Coin pulse slowed (5s)
- Orbit coin mobile text readability improved
- Mobile section spacing polished
- Command search softened
- No new colors, features, or pages

## Custom Goods Station complete (July 2026)

- Custom ecosystem live as 7th orbit room
- CustomGoodsStation + CustomDiscoveryCarousel — swipe carousel for custom goods
- Custom carousel gesture model fixed
- Forest/sky room-backdrop per ecosystem (`room-backdrop` in home.css)
- Quote CTA via `hello@greenroad.group` (`buildCustomQuoteMailto`)
- Greenroad logo wired in wallet/header (`GreenroadWallet`)
- 7 ADG Promo on Demand starter discoveries in Custom carousel (see `GREENROAD_MEMORY.md`)
- Homepage default discovery: POD Adventure Brite Tumbler 20 oz
- Inquiry-only — checkout, proof editor, and shipping estimate UI NOT live
- `published: false` on discoveries does NOT gate UI

---

## Active backlog

| ID | Priority | Item |
|----|----------|------|
| UX-001 | High | Print legibility over forest backdrop — accordion triggers + section headings need pearl scrims; test all room backgrounds |
| UX-002 | Later | Live ADG color swatches + logo quick-render preview |
| UX-003 | Later | ADG proof approval gate — quick render is draft; ADG mockup required before production |
| EVT-001 | Presentation | Reunion public facts match the current poster. Reunion World presentation is authorized. Payment, webhook, Supabase, migration, and email code stay frozen |

---

## Zeyoda reference files to port (later)

| File | Use |
|------|-----|
| `OrbitPeekCarousel.tsx` | Featured discovery swipe |
| `ThemeOrbitRenderer.tsx` | Room orbit |
| `OvalGlowBackdrop.tsx` | Hero glow |
| `useFeaturedAsset.ts` | Featured discovery loader |
| `useCommandSystem.ts` | Bottom search/filter |
| `Wallet.tsx` | Your Green Road shell |

**Do not port:** Solidity, Hardhat, Zeyoda `.env`, Zeyoda Supabase keys.

## Open questions (ask Jai, do not guess)

1. Desk Plants NET price for one SKU
2. Rebecca/Jai can place Desk Plants orders at NET without Mom per sale?
3. Reunion ticket tax classification and live Stripe Tax registration must be
   verified before accepting live payments.

## Vercel

Site live at `greenroad.group`. Vercel deploys from `main`. Redeploy follows push to origin/main.
