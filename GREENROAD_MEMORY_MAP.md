# GREENROAD_MEMORY_MAP.md

## Purpose

This file tells agents, GOSHBOT, and future project helpers how to route Greenroad ideas, decisions, and tasks.

Greenroad Group belongs inside the larger ZEYODA ecosystem, but it has its own identity, tone, business model, and operating lanes.

The goal of this memory map is to keep Greenroad coherent before site work, sheet work, MCP work, or commerce work begins.

## Core Current Truth

Greenroad Group is not pivoting away from sustainability.

Greenroad remains focused on:

* better everyday goods
* greener systems
* sustainable swaps
* healthier homes
* lower-waste lifestyles
* thoughtful product discovery
* ecosystem guides
* curated commerce with purpose

Custom goods are the first practical sales lane because they match Jai's current positioning with artists, small businesses, events, promo goods, gifting, and personalized products.

**Sustainability is the north star.**

**Custom goods are the money-now lane.**

**Better everyday goods are the trust and content engine.**

## Reunion Ticketing Exception (Locked September 21, 2026)

The SGHS Class of 2006 reunion is the first real Greenroad Community discovery
and the only currently authorized Stripe commerce build.

Locked boundaries:

* Permanent public route: `/events/scotia-2006`
* Event date: Saturday, October 31, 2026
* Time zone: `America/New_York`
* Free kickball / costume gathering: Collins Park, Scotia, NY, noon to sunset,
  open to Tartans, all ages
* Paid dinner: Beukendaal Temple, 22 Schonowee Ave, Schenectady, NY 12302,
  5 PM–8 PM, with live music / DJ until 10 PM
* The current reunion flyer may be temporary artwork until the transaction URL,
  sponsors, and final design are approved
* Do not invent missing public copy
* Dinner ticket total: $20.06 per ticket, tax included; never add tax on top
* Initial Batch 1 capacity: 80 tickets
* Batch 1 maximum per order: 8 tickets, stored as batch configuration
* Buyer-facing Stripe Checkout duration: 30 minutes
* Pre-Stripe database reservation: 35-minute internal safety hold
* Attaching the Stripe Session shortens the database reservation to Stripe's
  actual 30-minute `expires_at`; attachment must never extend the provisional hold
* Expired unattached provisional reservations may be cleaned up safely
* Attached reservations are released only through later verified Stripe
  lifecycle processing, never from a browser cancel redirect
* Batch 1 is not a lifetime event-sales cap; Jai may manually release later
  batches with different limits
* Never auto-create or auto-open a later batch
* Purchaser name and email required; attendee names and QR tickets are not V1
* One individual ticket record per purchased ticket
* Greenroad Group Holdings LLC is merchant of record
* Stripe-hosted Checkout, Greenroad Supabase payment truth, and Resend
  transactional confirmation
* Checkout returns to `/events/scotia-2006`; query state is UX only
* Tax classification and live Stripe Tax registration must be verified before
  live payments, but do not block schema or sandbox work

This is a narrow Community ticketing exception. It does not authorize Custom
Goods checkout, generic checkout, invoicing, Terminal/POS, subscriptions, or
other Greenroad payment rails.

## Working Positioning

Public-facing working phrase:

**Custom merch and better everyday goods -- grouped in one place.**

Custom-goods action phrase:

**Upload it. Preview it. Gribbit.**

Meaning:

* upload a logo, name, art, initials, or idea
* preview a proof or mockup
* approve it
* gribbit / grab it / order it

## Public Boundary Rule

ZEYODA is internal parent/foundation memory only.

The word ZEYODA should not appear in public Greenroad frontend copy, customer-facing UI, SEO text, product pages, or marketing language unless Jai explicitly approves.

Internal docs may reference ZEYODA. Public Greenroad copy should not.

## Ecosystem Relationship

### 1. ZEYODA Parent / Foundation

ZEYODA means Zen Yoga Dance.

It is a way of being, a parent foundation, and an internal grounding system for the broader ecosystem.

ZEYODA provides:

* parent philosophy
* sovereignty-first structure
* system coherence
* shared pattern memory
* long-term orientation
* internal foundation for related projects

Internal phrase:

**ZEYODA protects and grounds the ecosystem.**

### 2. Artistocks Commerce DNA

Artistocks is the artist commerce, launch, and ownership layer.

It provides:

* artist listing DNA
* commerce flow thinking
* launch-page behavior
* product/listing structure
* ownership and market patterns
* artist-linked sales context

Internal phrase:

**Artistocks launches and sells.**

### 3. ArtisTalks Education DNA

ArtisTalks is the education, coaching, and curriculum layer.

It provides:

* teaching structure
* artist preparation
* public education language
* guided onboarding ideas
* curriculum thinking
* coaching/content boundaries

Internal phrase:

**ArtisTalks teaches.**

### 4. Greenroad Better Goods + Custom Goods

Greenroad is the better-goods and thoughtful-commerce layer.

It provides:

* curated better everyday goods
* greener solutions
* sustainable swaps
* ecosystem guides
* custom goods
* promo-on-demand opportunities
* practical commerce with purpose

Internal phrase:

**Greenroad curates and sells better/custom goods.**

### 5. GOSHBOT Memory Router

GOSHBOT is the memory router, operator, and drift-warning system.

It should:

* track Greenroad decisions
* route tasks into the correct lane
* preserve what was decided
* warn when the project is drifting
* remind Jai what is next
* watch for stale docs
* keep Greenroad separate from Artistocks and ArtisTalks while preserving shared ecosystem context

Internal phrase:

**GOSHBOT routes memory and warns about drift.**

### 6. Shared Ecosystem Patterns

Shared Ecosystem Patterns are reusable UX and system ideas borrowed across ZEYODA, Artistocks, ArtisTalks, and Greenroad.

These patterns may include:

* orbit navigation
* carousel behavior
* wallet/account shell
* deep links
* chat-first UX
* guided onboarding
* launch/listing flows
* seamless homepage state changes

Greenroad can borrow these patterns while keeping its own voice.

Greenroad's voice should remain:

* upscale
* conscious
* useful
* peaceful
* trusted
* creative
* practical
* human-edited
* commerce with purpose
* positively disruptive

Greenroad is its own kind of rock n roll: peaceful, useful, independent, creative, and positively disruptive.

### 7. Greenroad Operations

Greenroad Operations are the working systems behind the business.

This lane includes:

* Becca editorial workflow
* Google Docs drafts
* existing Greenroad Google Sheet control board
* Custom Goods / ADG tabs
* product sorting
* margin checks
* proof availability
* Google Sheets MCP
* GOSHBOT reminders
* PRD updates
* roadmap updates
* decision logs

## Existing Google Sheet Control Board

The existing Google Sheet is the operating control board:

**AI Copy of Greenroad Group Product List 6.8.26**

Do not create a separate custom goods sheet unless the data outgrows the current control board.

Current tabs should remain:

* Products
* Suppliers
* Guides
* sleep eco.
* OKRs

Future custom-goods tabs should be added inside the same sheet:

* Custom Goods
* ADG Items
* First Offers
* Questions

Purpose:

* Products = better goods and discoveries
* Suppliers = vendors, brands, and partners
* Guides = ecosystem content
* Custom Goods = organized custom product categories
* ADG Items = raw promo-on-demand sorting
* First Offers = selected starter custom products
* Questions = blockers before publishing or selling

## Greenroad Memory Lanes

### Greenroad Public

Customer-facing identity, homepage language, brand promise, and public positioning.

Includes:

* Custom merch and better everyday goods
* Get Grouped In
* Gribbit
* public calls to action
* homepage wording
* customer trust language

### Better Everyday Goods

The core sustainability and content lane.

Includes:

* Desk Plants
* Sustainable Kitchen
* Sleep Ecosystem
* Office Ecosystem
* Bathroom
* Land
* Community
* greener replacements
* sustainable swaps
* product guides
* ecosystem guides

This lane is the long-term trust and content engine.

### Custom Goods

The money-now lane.

Includes separate product types such as:

* custom patches
* custom stickers
* custom shirts
* custom tumblers
* custom bottles
* custom glasses
* pint glasses
* pens
* Rocketbooks
* personalized journals
* notebooks
* artist merch
* business promo goods
* event merch
* gifts

Important rule:

Custom is the category or shelf. Each product type should be able to stand on its own.

Patches and stickers should not be forced into one combined product card.

### Commerce / Listings

Future selling systems.

Includes:

* inquiry flow
* proof approval flow
* pricing/margin tracking
* affiliate links
* supplier relationships
* promo-on-demand
* future listings
* future checkout
* future account or affiliate system

Do not build full commerce too early.

### Operations / MCP

MCP is not finished.

Current state:

* Cursor can inspect publicly accessible Google Sheets/Docs when links or browser context allow.
* Cursor should not be treated as able to write to Sheets until Google Sheets MCP is explicitly configured and tested.

Needed later:

* Google Cloud project
* Google Sheets API
* Google Drive API
* service account
* service account shared with existing Greenroad sheet
* MCP config
* safe Z999 write test
* controlled sheet writes only after sheet structure is stable

## Becca's Role

Becca is an editor, curator, and custom-goods voice.

AI can:

* generate ideas
* organize notes
* extract fields
* summarize research
* suggest copy

Becca should:

* rewrite final language
* make the voice original
* prevent AI sameness
* improve trust
* help pace content releases
* help sort custom-goods opportunities

Content should be human-edited and released gradually.

## Live on Site (July 6, 2026)

Custom Goods lane is **live on main** — not the full ADG catalog.

* Custom ecosystem (7th orbit room) + Custom Goods Station + swipe carousel
* Forest/sky room-backdrop per ecosystem
* Quote CTA: `hello@greenroad.group` (inquiry mailto — checkout/proof/shipping NOT live)
* Greenroad logo in wallet/header area
* **7 ADG Promo on Demand starter items** in Custom carousel:

| Product | Item | Qty-1 |
|---------|------|-------|
| POD Adventure Brite Tumbler 20 oz | A401191PD | $15.83 |
| POD Cruise Brite Tumbler 12 oz | A401190PD | $14.58 |
| POD Accent Mug Full Color 11 oz | AHDACNTPD | $7.92 |
| POD Adult Fleece Hoodie Full Color | WM401639FCPD | $37.00 |
| POD Adult Fleece Full Zip Hoodie Full Color | WM401640FCPD | $35.00 |
| POD Adult Vintage Heather Hoodie Full Color | WM401642FCPD | $26.67 |
| POD 3 Piece Whiskey Gift Set | WM402100PD | $35.42 |

All carry +$25 ADG Service Advantage Fee per order. `published: false` does **not** gate UI.

Homepage default discovery: 20 oz tumbler. Add new ADG SKU surgically via JSON + hero + `data/index.ts` only.

## Active UX Backlog

### High — Print legibility over forest backdrop

Accordion closed triggers and Continue Exploring section headings sit on the room-backdrop photo. They can wash out on light/misty areas.

Fix rules:

* Use pearl reading surfaces or local scrims per material system
* Do not rely only on random text shadows
* No gold body text on pearl
* Test all ecosystem backgrounds in `data/roomBackgrounds.ts`

### Later — Custom goods preview UX

* Live ADG color swatches with real-time hero preview
* Logo upload + quick render on product image
* ADG proof approval gate — quick render is draft only; ADG mockup required before production

## Current Operating Priorities

### Priority 1 -- Print Legibility (UX-001)

Fix accordion triggers and section headings readability over room-backdrop photos.

### Priority 0 -- Reunion Phase 1 SQL review

Phase 1 artifacts were created September 21, 2026:

1. sync the four read-first memory documents
2. restore or park the previous broad Stripe scope
3. create reviewable Supabase migration SQL without applying it

Phase 1 is stopped for Jai's SQL review. No Phase 2 work is authorized. Do not
build Checkout, webhook fulfillment, reunion UI, or email.
Do not use git, read `.env` / `.env.local`, touch live Stripe, or apply Supabase
migrations.

### Priority 2 -- Memory / PRD Cleanup

Docs synced July 6: `GREENROAD_MEMORY_MAP.md`, `GREENROAD_MEMORY.md`, `AGENT_NOTES.md`, `PRD.json`.

Remaining:

1. VOICE_AND_VISION.md
2. LAUNCH_ROADMAP.md
3. SESSION_REPORT.md

### Priority 3 -- Existing Sheet Control Board

Use the existing Greenroad Google Sheet as the operating control board.

Add the custom-goods tabs inside that sheet.

Do not create a separate custom goods sheet yet.

### Priority 4 -- Custom Goods / ADG Sorting (remaining catalog)

Sort remaining promo-on-demand products in sheet by:

* product type
* category
* supplier link
* suggested site price
* Greenroad advertised price
* estimated cost
* fee
* shipping
* margin
* minimum order
* decoration type
* proof availability
* production time
* Greenroad fit
* buyer type
* sustainability angle
* priority
* notes

Pricing note:

Greenroad may advertise custom promo-on-demand goods around 5% below the supplier's suggested site price, but only after checking actual margin item by item.

**7 starter offers are live on site** — at the 5–8 cap. Do not add full catalog without Jai approval.

### Priority 5 -- Starter Offer Selection

**Done (July 6):** 7 ADG starter offers live in Custom carousel. Hold here unless Jai approves more.

### Priority 6 -- Google Sheets MCP

Resume MCP after the docs and sheet structure are coherent.

Do not automate writing to sheets before the control board is stable.

### Priority 7 -- Site Work (ongoing)

**Done (July 6):**

* Custom as 7th orbit room + Custom Goods Station
* 7 ADG starter custom offers
* Manual inquiry CTA (`hello@greenroad.group`)
* Forest/sky room-backdrop

**Still not live:**

* checkout / Stripe
* proof editor
* shipping estimate UI
* full ADG catalog
* live color swatches / logo quick render

**Next site fix:** print legibility over room-backdrop (UX-001).

## Do Not Build Yet

Do not build yet:

* full ADG catalog
* Custom Goods payment / Stripe
* generic checkout, invoicing, Terminal/POS, or subscriptions
* reunion Checkout, webhook fulfillment, event UI, or email before Phase 1 SQL
  is reviewed and Jai approves the next phase
* proof editor
* account system
* TinaCMS
* sub-orbits
* mass content publishing
* full marketplace/listings
* public ZEYODA copy on Greenroad

## Decision Rules

If an idea is about public homepage language, route to Greenroad Public.

If an idea is about sustainable/home/lifestyle products, route to Better Everyday Goods.

If an idea is about custom merch, promo goods, personalized products, or ADG, route to Custom Goods.

If an idea is about checkout, inquiries, affiliates, listings, or money flow, route to Commerce / Listings.

If an idea is about SGHS Class of 2006 reunion ticketing, route it to the
locked Community ticketing exception and preserve `/events/scotia-2006` as its
permanent public home.

If an idea borrows from ZEYODA, Artistocks, or ArtisTalks UX, route to Shared Ecosystem Patterns.

If an idea uses ZEYODA language, check whether it is internal-only. Do not route ZEYODA into public Greenroad copy unless Jai explicitly approves.

If an idea involves Becca, Sheets, Docs, MCP, GOSHBOT, roadmap, PRD, or decision logs, route to Greenroad Operations.

## Drift Warnings GOSHBOT Should Raise

GOSHBOT should warn when:

* Custom goods start replacing the sustainability mission
* site work starts before docs/sheet decisions are coherent
* ZEYODA language appears in public Greenroad copy
* a custom product is being added before margin/proof/supplier questions are answered
* Becca's editorial role is bypassed for publishable content
* mass AI content is being proposed without human editing
* the project starts building checkout, proof editor, or full catalog too early
* reunion ticketing expands into generic Greenroad or Custom Goods commerce
* code auto-creates a later ticket batch or hardcodes the Batch 1
  `max_per_order` application-wide
* a sequential capacity test is represented as proof of concurrent safety;
  pre-launch QA requires a real two-session database concurrency test
* accordion or section headings are left on forest backdrop without pearl reading surfaces where legibility fails

## One-Sentence Current Truth

Greenroad Group is an upscale better-goods and custom-goods commerce project:
sustainability is the north star, Custom Goods Station remains inquiry-only,
and the SGHS Class of 2006 reunion is the sole approved Stripe exception,
currently limited to memory cleanup, scope restoration, and reviewable
unapplied Supabase SQL.
