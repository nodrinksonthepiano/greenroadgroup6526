# Greenroad Memory — Agent Handoff

**Last synced:** June 15, 2026 (post–memory map + custom-goods strategy correction)

Read `GREENROAD_MEMORY_MAP.md` first, then this file. Do not assume pearl/olive work is on an experiment branch — that is outdated.

---

## Current Git Truth

```text
Active branch:     main
Current commit:    af1060d — Revert "Add Custom as 7th Room/orbit coin and Custom Patches & Stickers discovery"
origin/main:       af1060d (up to date after revert)
Working tree:      clean
Build:             npm run build passed before 2A commit; not rerun during memory cleanup
```

`experiment/pearl-print-surface` is **historical/backed up**. It is not the active working branch. Do not tell agents pearl/olive is uncommitted or only on the experiment branch.

**Recent commits:**
- `af1060d` — Revert "Add Custom as 7th Room/orbit coin and Custom Patches & Stickers discovery" (main restored)
- `fdb2169` — Custom as 7th Room/orbit coin and Custom Patches & Stickers discovery. The reverted custom-goods work exists in commit `fdb2169`, but it is not an approved active branch/work path. Do not reuse it blindly.
- `1fa3cb4` — Priority 2A: mobile calm + orbit readability (pushed)
- `fbca51d` — Sync Greenroad memory and product docs
- `4cf6e9e` — Pearl/olive material system

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
app/page.tsx                          → single route
app/components/home/HomePage.tsx      → page shell
app/components/home/FeaturedDiscovery.tsx
app/components/home/DiscoveryAccordions.tsx
app/components/home/ContinueExploring.tsx
app/components/home/CommandSearch.tsx
app/components/home/EcosystemOrbitRenderer.tsx  → ORBIT_SPEED = 0.09
app/components/home/OvalGlowBackdrop.tsx

app/styles/tokens.css                 → ALL color tokens (edit here first)
app/styles/home.css                   → homepage UI including print surfaces + 2A spacing/search
app/styles/ecosystem-orbit.css        → orbit coins; pulse 5s; mobile labels 0.625rem / 0.58rem
app/globals.css                       → body silver-on-forest; no print tokens in @theme

data/discoveries/desk-plants-mini-harlow.json  → first discovery fixture
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

## Next Work — Priority 2B: Memory + Operating System

**No homepage/code changes until docs and sheet direction are coherent.** Strategic phase:

1. Sync docs to the corrected strategic truth: `GREENROAD_MEMORY.md`, `VOICE_AND_VISION.md`, `PRD.json`, `LAUNCH_ROADMAP.md`, `SESSION_REPORT.md`
2. Use the existing Greenroad Google Sheet as the operating control board
3. Add custom-goods tabs inside that sheet, not in a separate new sheet unless the data outgrows the current control board
4. Sort ADG / promo-on-demand products by category, proof availability, cost, fee, shipping, margin, buyer type, sustainability angle, and priority
5. Choose 5–8 starter custom offers before adding anything large to the site
6. Continue ecosystem-guide planning after the operating system is clean

Homepage UX polish (2A) is complete. Phone-test before major distribution push.

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

- **ID:** `desk-plants-mini-harlow`
- **Title:** Desk Plants — Mini Harlow
- **Hook:** Fresh air in the office
- **Why:** Real living plants, not plastic
- **Ecosystem badge:** Office Ecosystem (olive)

---

## Prompt Templates

### Continue from main (current)

```text
Read GREENROAD_MEMORY_MAP.md first, then GREENROAD_MEMORY.md. I'm on main at af1060d after the custom-coin revert.
Pearl/olive material system is live (4cf6e9e). Priority 2A mobile polish is done (1fa3cb4). The reverted custom-goods work exists in commit fdb2169, but it is not an approved active branch/work path. Do not reuse it blindly.
Material system: forest=world, pearl=reading, olive=labels/secondary, gold=accent only.
Orbit: ORBIT_SPEED 0.09, pulse 5s. Do not change page background, orbit fills, or glow unless I ask.
Next work is Priority 2B: memory + operating system cleanup. No homepage/code changes from this task.
```

### Priority 2B memory / operating-system pass

```text
Priority 2B only — docs/memory/PRD/roadmap cleanup and existing Google Sheet control-board planning.
Greenroad = better goods + greener systems + custom goods. Sustainability is the north star. Custom goods are the money-now lane, not the whole identity. Existing Greenroad Google Sheet is the control board.
ZEYODA is internal-only; do not place ZEYODA in public Greenroad copy unless Jai explicitly approves.
No homepage UI changes unless Jai asks. No scores, ratings, certified, or approved badge language.
```

---

## One-Line Status

**Main/origin main are at `af1060d` after reverting the custom-coin commit; pearl/olive remains live (`4cf6e9e`), Priority 2A mobile calm polish remains part of history (`1fa3cb4`), and next work is Priority 2B memory + operating-system cleanup before sheet/MCP/site work.**
