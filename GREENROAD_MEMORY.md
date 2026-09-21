# Greenroad Memory — Agent Handoff

**Last synced:** September 21, 2026 (reunion Phase 1 approval)

Read `GREENROAD_MEMORY_MAP.md` first, then this file. Do not assume pearl/olive work is on an experiment branch — that is outdated.

**Git:** Jai handles all git manually. Agents do not run git commands unless Jai explicitly asks.

---

## Site State (July 6, 2026)

```text
Branch:            main (Jai manages commits and pushes)
Custom Goods:      LIVE — Custom ecosystem + Custom Goods Station + swipe carousel
Backdrop:          LIVE — forest/sky room-backdrop per ecosystem (data/roomBackgrounds.ts)
Quote CTA:         hello@greenroad.group (buildCustomQuoteMailto in data/discoverySearch.ts)
Logo:              Wired in wallet/header area (GreenroadWallet)
Homepage default:  POD Adventure Brite Tumbler 20 oz (app/page.tsx)
Checkout/proof:    NOT live — inquiry mailto only; manual ADG proof before production
Full ADG catalog:  NOT live — 7 starter ADG items only
published field:   Does NOT gate UI — all discoveries render regardless of published:false
Reunion route:     PLANNED — /events/scotia-2006; no event UI or payment flow live
```

`experiment/pearl-print-surface` is **historical/backed up**. Pearl/olive material system is live on main.

**Recent shipped work (homepage):**
- Custom Goods Station + CustomDiscoveryCarousel on Custom orbit
- Custom carousel gesture model fixed (swipe/wheel progress convention aligned)
- Forest/sky room-backdrop with scrim and top/bottom bookends
- 7 ADG Promo on Demand starter discoveries in Custom carousel

---

## SGHS Class of 2006 Reunion (locked September 21, 2026)

This is the first real Greenroad Community discovery and the only approved
Stripe exception. Custom Goods remains inquiry-only.

```text
Permanent route:       /events/scotia-2006
Date / time zone:      Saturday, October 31, 2026 / America/New_York
Free gathering:        Collins Park, Scotia, NY / noon–sunset / all ages
Dinner:                Beukendaal Temple / 5 PM–8 PM / music or DJ until 10 PM
Dinner address:        22 Schonowee Ave, Schenectady, NY 12302
Ticket total:          $20.06 each, tax included; never add tax on top
Batch 1:               80 tickets
Batch 1 max/order:     8 tickets, stored as batch data
Checkout duration:     30 minutes customer-facing
Provisional DB hold:   35 minutes before Stripe Session attachment
Merchant of record:    Greenroad Group Holdings LLC
Checkout:              Stripe-hosted
Payment truth:         Stripe webhook + Greenroad Supabase
Transactional email:  Resend
```

Inventory and identity rules:

- Batch 1 is not a lifetime cap; Jai may manually create and open later batches.
- Never auto-create or auto-open another batch.
- Later batches may use a different `max_per_order`.
- The initial 35-minute database hold is internal safety time for Stripe Session
  creation and crash recovery; it is not the buyer's Checkout duration.
- Attaching a Session must shorten `reservation_expires_at` to Stripe's actual
  30-minute expiration and must never extend the provisional hold.
- Expired unattached provisional orders may be released by service-role cleanup.
- Attached reservations are released only by later verified Stripe lifecycle
  handling, never by the return URL or browser cancellation.
- Purchaser name and email are required. Graduation year, connection note, and
  marketing opt-in are optional; marketing is off by default.
- A purchaser may buy multiple tickets without naming every attendee.
- Create one individual ticket row/number per paid ticket. No QR system in V1.
- Initial check-in may use purchaser name, email, order confirmation, and count.
- Future magic-link / OTP identity attaches to the same profile/email.
- Success and cancellation return to `/events/scotia-2006`; query parameters
  transform that surface but never prove payment.
- The current reunion flyer may be used as temporary artwork until the
  transaction URL, sponsors, and final design are approved.
- Do not invent missing public copy.

Tax and email boundaries:

- Greenroad is registered for New York sales tax and Stripe Tax is enabled.
- Do not invent the reunion ticket tax classification.
- Verify the tax classification and live Stripe Tax registration before live
  payments. This does not block schema or sandbox implementation.
- Planned sender: `Greenroad Group <tickets@updates.greenroad.group>`.
- Planned reply-to: `hello@greenroad.group`.
- Do not assume the sending subdomain is verified and do not reuse ArtisTalks
  sender, domain, or templates.

Phase 1 artifacts were completed September 21, 2026:

1. sync the four read-first memory documents
2. restore or park the previous broad Stripe scope
3. create reviewable Supabase migration SQL

The migration files remain unapplied. Work is stopped for Jai's SQL review.
Do not apply migrations or build Checkout, webhook fulfillment, event UI, or
email until Jai explicitly approves the next phase.

---

## What Greenroad Is

Greenroad is a **better-goods and custom-goods commerce project** with sustainability as the north star.

Greenroad is:
- a field guide
- a curator
- a trusted recommendation journal
- a discovery operating system for living well
- a custom-goods lane for artists, small businesses, events, gifting, promo goods, and personalized products
- curated commerce with purpose

Greenroad is **not**:
- a product scoring site
- a review site with ratings
- a sustainability police site
- a generic affiliate blog
- an Amazon-style commodity marketplace
- Wirecutter, Consumer Reports, or Good Housekeeping

**Strategic rule:** Preserve both lanes:

1. **Better Everyday Goods** — the trust/content engine: sustainable swaps, ecosystem guides, healthier homes, lower-waste lifestyles, and thoughtful product discovery.
2. **Custom Goods** — the money-now lane: custom merch, promo-on-demand, personalized gifts, artist merch, small-business goods, and event merch.

Custom goods are important, but they are not the whole identity.

**Working public phrase:** Custom merch and better everyday goods — grouped in one place.

**Custom action phrase:** Upload it. Preview it. Gribbit.

People want better sleep, mornings, kitchens, homes, and routines — not "sheets" or "coffee filters" as the headline story.

**Content strategy:** Ecosystem guides remain a core content engine. Products support guides as evidence; custom products can also stand alone when they are specific, useful, and margin/proof-ready.

Bad: Best Latex Pillow  
Good: How to Build a Sustainable Sleep Ecosystem

---

## Ecosystem / Public Boundary

`GREENROAD_MEMORY_MAP.md` is the routing source of truth.

```text
ZEYODA protects and grounds the ecosystem.
Artistocks launches and sells.
ArtisTalks teaches.
Greenroad curates and sells better/custom goods.
GOSHBOT routes memory and warns about drift.
```

ZEYODA is internal parent/foundation memory only. The word ZEYODA should not appear in public Greenroad frontend copy, customer-facing UI, SEO text, product pages, or marketing language unless Jai explicitly approves.

GOSHBOT should warn when:
- custom goods start replacing the sustainability mission
- site work starts before docs/sheet decisions are coherent
- ZEYODA language appears in public Greenroad copy
- custom products are proposed before margin, proof, supplier, and shipping questions are answered
- Becca's editorial role is bypassed for publishable content

---

## Locked Material System (live on main)

**Primary design reference:** Pony Club ribbon — forest + cream satin + olive/chartreuse layers + gold embroidery  
**Readability reference:** Amazon mobile — dark ink on light surfaces reads faster (not a visual target)

```text
Forest = world / background / orbit / chrome
Pearl  = primary reading surface
Olive  = labels + secondary cards
Gold   = buttons + borders + reward (NOT body text on light surfaces)
```

### Tokens (`app/styles/tokens.css`)

| Token | Value | Role |
|-------|-------|------|
| `--print-pearl` | `#f5f0e6` | Ribbon cream / parchment reading surface |
| `--print-olive` | `#b8ba84` | Paint chip — labels, secondary cards |
| `--ink` | `var(--green-deep)` | Body/title text on pearl and olive |
| `--ink-muted` | `rgba(26, 74, 46, 0.88)` | Secondary ink on print surfaces |
| `--green-deep` | `#1a4a2e` | Forest world |
| `--gold-lion` | `#c9a84c` | Trim, borders, buttons |

Print tokens are in CSS variables only — **not yet** in Tailwind `@theme` (`globals.css`).

### Non-negotiable rules

1. **No gold body/title text on pearl or olive** — borders, buttons, chevrons only (~1.1–2.1:1 contrast fails)
2. **Pearl = long-form reading** (featured body, accordion open panels)
3. **Olive = short labels/secondary cards** (ecosystem badge, explore cards, signal cards)
4. **Forest = world** — page background, orbit coins, glow, wallet, command search (unchanged intentionally)
5. **No scores, ratings, certified, or approved badge language**
6. **No full-page sage/olive background** — tested and rejected
7. **Components have zero color logic** — all styling in CSS by class name

### Surface map (on main today)

| Surface | Material | Selector |
|---------|----------|----------|
| Featured card body | Pearl + ink | `.featured-discovery__body` |
| Ecosystem badge | Olive + ink + gold border | `.featured-discovery__ecosystem-badge` |
| Accordion open panels | Pearl + ink, gold frame | `.discovery-accordion__panel` |
| Signal cards | Olive + ink | `.discovery-accordion__signal` |
| Continue Exploring cards | Olive + ink | `.continue-exploring__card` |
| Page background | Forest gradient | `.home-page` |
| Orbit coins | Forest + gold rings | `ecosystem-orbit.css` |
| Command search | Forest chrome | `.command-search` |
| Section titles | Gold on forest | `.home-section-title` |
| Accordion closed triggers | Silver on forest | `.discovery-accordion__trigger` |
| Room backdrop | Forest/sky photo + scrim | `.room-backdrop` |

**Known legibility gap:** Accordion closed triggers and section headings (`.discovery-accordion__trigger`, `.home-section-title`, `.home-section-subtitle`) sit directly on the room-backdrop photo. They can wash out on light/misty photo areas. Open accordion panels on pearl are fine. Fix is backlog — see Active Backlog below.

### Rejected experiments (do not retry without explicit ask)

| Test | Outcome |
|------|---------|
| Full-page sage `#9DC183` | Reverted — hierarchy lost |
| Olive as main card body | Rejected — pearl reads better |
| Gold text on pearl/olive | Rejected — contrast fails |
| Pearl accordion without gold frame | Felt B&W — gold trim added |

---

## Key Files

```text
app/page.tsx                          → single route; default discovery = 20 oz tumbler
app/components/home/HomePage.tsx      → page shell; custom mode when Custom orbit selected
app/components/home/FeaturedDiscovery.tsx
app/components/home/CustomGoodsStation.tsx      → Custom orbit frame
app/components/home/CustomDiscoveryCarousel.tsx → swipe carousel for custom goods
app/components/home/DiscoveryAccordions.tsx
app/components/home/ContinueExploring.tsx
app/components/home/CommandSearch.tsx
app/components/home/GreenroadWallet.tsx         → logo in header/wallet area
app/components/home/EcosystemOrbitRenderer.tsx  → ORBIT_SPEED = 0.09
app/components/home/OvalGlowBackdrop.tsx

app/styles/tokens.css                 → ALL color tokens (edit here first)
app/styles/home.css                   → homepage UI, room-backdrop, print surfaces + 2A spacing/search
app/styles/ecosystem-orbit.css        → orbit coins; pulse 5s; mobile labels 0.625rem / 0.58rem
app/globals.css                       → body silver-on-forest; no print tokens in @theme

data/index.ts                         → discovery registry (DISCOVERY_SLUGS load order)
data/discoverySearch.ts               → search, featured view, hello@greenroad.group mailto
data/roomBackgrounds.ts               → per-ecosystem backdrop images
data/discoveries/*.json               → one file per discovery
data/suppliers/adg-promo.json         → ADG Promo supplier record
```

---

## Session History (completed)

| Session | Commit / date | Delivered |
|---------|---------------|-----------|
| 1 | 2026-06-05 | Scaffold, tokens, fonts, folders, memory docs |
| 2 | 2026-06-05 | Discovery JSON schema + Desk Plants data |
| 3 | 2026-06-05 | Homepage discovery experience |
| 3A | 2026-06-05 | Hero image, orbit, search, coming into view |
| Header polish | `13df07d` | Header layering, featured copy |
| Pearl/olive | `4cf6e9e` | Print material system merged to main |
| Doc sync | `fbca51d` | Memory/PRD/roadmap synced |
| Priority 2A | `1fa3cb4` | Mobile calm + orbit readability polish |
| Custom Goods | July 2026 | Custom orbit, Custom Goods Station, carousel, 7 ADG starter items, room-backdrop |

### Priority 1 — Reading surface ✅ DONE

- Pearl featured body ✅
- Olive secondary surfaces ✅
- Pearl accordion panels + gold frame ✅

### Priority 2A — Mobile calm + readability ✅ DONE (`1fa3cb4`)

Delivered (no new colors, features, or pages):

- Orbit rotation slowed: `ORBIT_SPEED` 0.3 → **0.09**
- Coin pulse slowed: 2s → **5s**
- Orbit coin label readability on mobile: **0.625rem** (≤768px), **0.58rem** (≤480px)
- Mobile spacing: featured discovery → orbit hint → Discovery Context → Continue Exploring
- Command search softened: lower gradient opacity, lighter input, smaller focus ring
- Files: `EcosystemOrbitRenderer.tsx`, `ecosystem-orbit.css`, `home.css`

---

## Custom Goods on Site (July 6, 2026)

**7 ADG Promo on Demand starter items** in the Custom carousel (`room: "custom"`, `supplier_id: "adg-promo"`, `sale_type: "inquiry"`). All carry +$25 ADG Service Advantage Fee per order. This is **not** the full ADG catalog.

| # | Product | Item | Qty-1 price |
|---|---------|------|-------------|
| 1 | POD Adventure Brite Tumbler 20 oz | A401191PD | $15.83 |
| 2 | POD Cruise Brite Tumbler 12 oz | A401190PD | $14.58 |
| 3 | POD Accent Mug Full Color 11 oz | AHDACNTPD | $7.92 |
| 4 | POD Adult Fleece Hoodie Full Color | WM401639FCPD | $37.00 |
| 5 | POD Adult Fleece Full Zip Hoodie Full Color | WM401640FCPD | $35.00 |
| 6 | POD Adult Vintage Heather Hoodie Full Color | WM401642FCPD | $26.67 |
| 7 | POD 3 Piece Whiskey Gift Set | WM402100PD | $35.42 |

Carousel order follows `DISCOVERY_SLUGS` filter for `room: "custom"`. Homepage SEO/default discovery remains the 20 oz tumbler.

**Add new ADG SKU surgically:** one JSON in `data/discoveries/`, one hero in `public/discoveries/`, three touch points in `data/index.ts`. No component changes required unless new UX is requested.

---

## Active Backlog

### UX — High priority

**Print legibility over forest backdrop**
- Accordion closed triggers (`.discovery-accordion__trigger`) and Continue Exploring headings (`.home-section-title`, `.home-section-subtitle`) can wash out on light/misty areas of room-backdrop photos
- Fix should use **pearl reading surfaces or local scrims** per material system
- Do not rely only on random text shadows
- No gold body text on pearl
- Test across all ecosystem backdrops in `data/roomBackgrounds.ts`
- Files: `home.css`, `DiscoveryAccordions.tsx`, `ContinueExploring.tsx`, `HomePage.tsx`

### Custom goods UX — Later

- Live ADG color swatches with real-time hero preview (products with color options)
- Logo upload + quick render preview on product image
- ADG proof approval gate — quick render is draft only; final production requires ADG official proof/mockup approval

### Ops — Unchanged

- Google Sheet tabs: Custom Goods, ADG Items, First Offers, Questions (not yet added)
- Sort remaining ADG catalog in sheet — do not import full catalog to site
- Manual inquiry/proof flow before Stripe/checkout

---

## Next Work

1. Review the reunion Phase 1 SQL. The migrations are not applied.
2. Require Jai's explicit authorization before Phase 2.
3. **UX-001:** Print legibility fix remains the next unrelated homepage task.
4. Sync remaining docs: `VOICE_AND_VISION.md`, `LAUNCH_ROADMAP.md`, `SESSION_REPORT.md`.
5. Continue existing sheet and ecosystem-guide work without expanding Custom
   Goods commerce.

Phone-test legibility and Custom carousel before major distribution push.

---

## Content Strategy — Ecosystem Guides First

Priority guide ideas:
- Sustainable Sleep Ecosystem
- Sustainable Coffee Ecosystem
- Sustainable Kitchen Ecosystem
- Sustainable Cleaning Ecosystem
- Sustainable Lighting Ecosystem
- Sustainable Hosting Ecosystem
- Non-Toxic Home Basics

Product pages support these guides. Guides are the story; products are supporting evidence.

---

## Existing Operating Spreadsheet (Greenroad Control Board)

Use the existing Google Sheet:

**AI Copy of Greenroad Group Product List 6.8.26**

Do not create a separate custom goods sheet yet. Add custom-goods tabs inside the existing sheet so better goods, guides, suppliers, and custom goods stay in one operating system.

Current tabs:

- Products
- Suppliers
- Guides
- sleep eco.
- OKRs

Add future tabs:

- Custom Goods
- ADG Items
- First Offers
- Questions

### Existing Better-Goods Tabs

**Products**
Product | Ecosystem | Problem Solved | Why We Like It | Considerations | Evidence | Supplier | Status | Publish Priority

**Suppliers**
Brand | Contact | Product Category | Relationship Strength | Outreach Status | Notes

**Guides**
Guide Title | Ecosystem | Status | Publish Priority | Products Needed | Notes

### Custom-Goods Tabs

**Custom Goods**
Category | Product Type | Buyer Type | Use Case | Supplier | Proof Available? | Minimum Order | Production Time | Sustainability Angle | Priority | Notes

**ADG Items**
Product Name | Category | Supplier Link | Suggested Site Price | Greenroad Advertised Price | Estimated Cost | Fee | Shipping | Margin | Minimum Order | Decoration Type | Proof Available? | Production Time | Greenroad Fit | Buyer Type | Sustainability Angle | Priority | Notes

**First Offers**
Product Type | Supplier | Why First | Buyer | Proof Flow | Margin Status | Sustainability Angle | Publish Readiness | Notes

**Questions**
Question | Status | Answer / Notes | Blocks

### MCP Status

Cursor can inspect publicly accessible Google Sheets/Docs when links or browser context allow. Cursor should not be treated as able to write to Sheets until Google Sheets MCP is explicitly configured and tested.

Needed later:
- Google Cloud project
- Google Sheets API
- Google Drive API
- service account
- service account shared with existing Greenroad sheet
- MCP config
- safe Z999 write test
- controlled sheet writes only after sheet structure is stable

---

## Custom Goods Strategy

Custom Goods is the category / shelf. Each product type should be able to stand on its own.

Do not force patches and stickers into one combined product card. Both can live under Custom, but they are separate product types.

Starter product types to evaluate:
- custom patches
- custom stickers
- custom shirts
- custom tumblers
- custom bottles
- custom glasses / pint glasses
- pens
- Rocketbooks
- personalized journals
- notebooks
- artist merch
- business promo goods
- event merch
- gifts

The ADG `POD Adventure Brite Stainless Tumbler 20 oz` is a strong candidate and proof-preview example, but it should not become the whole custom strategy.

Pricing note: Greenroad may advertise custom promo-on-demand goods around 5% below the supplier's suggested site price, but only after checking actual margin item by item, including cost, service fee, shipping, and production constraints.

Proof-preview language:

```text
Upload it. Preview it. Gribbit.
```

Manual or semi-manual proofing is acceptable for MVP. A full design editor is not MVP.

---

## Becca Editorial Role

Becca is an editor, curator, and custom-goods voice.

AI can generate ideas, organize notes, extract fields, summarize research, and suggest copy.

Becca should rewrite final language, make the voice original, prevent AI sameness, improve trust, help pace content releases, and help sort custom-goods opportunities.

Content should be human-edited and released gradually.

---

## Featured Discovery Fixture

**Homepage default (July 6):**
- **ID:** `pod-adventure-brite-tumbler-20oz`
- **Title:** POD Adventure Brite Stainless Tumbler 20 oz
- **Hook:** Upload it. Preview it. Gribbit.
- **Ecosystem:** Custom Goods

**First better-goods fixture (still on site):**
- **ID:** `desk-plants-mini-harlow` — Office Ecosystem

---

## Prompt Templates

### Continue from main (current)

```text
Read GREENROAD_MEMORY_MAP.md first, then GREENROAD_MEMORY.md.
Custom Goods Station is live on main — 7 ADG starter items in Custom carousel. Forest/sky room-backdrop live. Quote CTA: hello@greenroad.group. Logo wired in wallet/header.
Material system: forest=world, pearl=reading, olive=labels/secondary, gold=accent only. No gold body text on pearl.
Checkout/proof/shipping NOT live — inquiry mailto only. published:false does NOT gate UI. Full ADG catalog NOT live.
Next UX priority: print legibility over room-backdrop (accordion triggers + section headings). Jai handles all git.
```

### Reunion Phase 1

```text
Read GREENROAD_MEMORY_MAP.md, GREENROAD_MEMORY.md, AGENT_NOTES.md, and PRD.json.
The SGHS Class of 2006 reunion is the only approved Stripe exception. Permanent
route: /events/scotia-2006. Batch 1: 80 tickets, max_per_order 8 in batch data,
30-minute buyer Checkout, 35-minute pre-Stripe safety hold, $20.06 total per
dinner ticket tax included.
Phase 1 files are complete and stopped for SQL review. Do not apply migrations
or build Checkout, webhook fulfillment, event UI, or email. No git, no .env,
no live Stripe.
```

### Surgical ADG product add

```text
Add one ADG discovery only: JSON in data/discoveries/, hero in public/discoveries/, register in data/index.ts.
room: custom, supplier_id: adg-promo, sale_type: inquiry. No component changes unless I ask.
Do not import full ADG catalog. No scores, ratings, certified, or approved badge language.
```

---

## One-Line Status

**Custom Goods Station remains inquiry-only; the SGHS Class of 2006 reunion is
the sole approved Stripe exception; Phase 1 is complete with reviewable
unapplied Supabase SQL, and work is stopped for Jai's review.**

**Pre-launch QA requirement:** The migration test fills Batch 1 sequentially.
Before sales open, run a real two-session transaction test against the Greenroad
sandbox database to verify row-lock behavior under simultaneous reservations.
