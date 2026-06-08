# Greenroad Memory — Agent Handoff

**Last synced:** June 8, 2026 (post–Priority 2A)

Read this file first. Do not assume pearl/olive work is on an experiment branch — that is outdated.

---

## Current Git Truth

```text
Active branch:     main
Current commit:    1fa3cb4 — Polish homepage mobile calm and orbit readability
origin/main:       1fa3cb4 (up to date)
Working tree:      clean
Build:             npm run build passed (before 2A commit)
```

`experiment/pearl-print-surface` is **historical/backed up**. It is not the active working branch. Do not tell agents pearl/olive is uncommitted or only on the experiment branch.

**Recent commits:**
- `1fa3cb4` — Priority 2A: mobile calm + orbit readability (pushed)
- `fbca51d` — Sync Greenroad memory and product docs
- `4cf6e9e` — Pearl/olive material system

---

## What Greenroad Is

Greenroad is a **trusted curator of sustainable living systems**.

Greenroad is:
- a field guide
- a curator
- a trusted recommendation journal
- a discovery operating system for living well

Greenroad is **not**:
- a product scoring site
- a review site with ratings
- a sustainability police site
- a generic affiliate blog
- a marketplace-first experience
- Wirecutter, Consumer Reports, or Good Housekeeping

**Strategic rule:** Organize around **ecosystems**, not isolated products.

People want better sleep, mornings, kitchens, homes, and routines — not "sheets" or "coffee filters" as the headline story.

**Content strategy:** Ecosystem guides are the main content engine. Products support guides as evidence; products are not the main story.

Bad: Best Latex Pillow  
Good: How to Build a Sustainable Sleep Ecosystem

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

## Next Work — Priority 2B: Content System

**No app code unless Jai asks.** Strategic phase:

1. Rebecca operating spreadsheet (Products, Suppliers, Guides tabs)
2. First ecosystem guide(s) — guides are the story; products are evidence

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

## First Operating Spreadsheet (90-day OS)

Create a simple 3-tab spreadsheet:

**Tab 1 — Products**
Product | Ecosystem | Problem Solved | Why We Like It | Considerations | Evidence | Supplier | Status | Publish Priority

**Tab 2 — Suppliers**
Brand | Contact | Product Category | Relationship Strength | Outreach Status | Notes

**Tab 3 — Guides**
Guide Title | Ecosystem | Status | Publish Priority | Products Needed | Notes

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
Read GREENROAD_MEMORY.md first. I'm on main at 1fa3cb4.
Pearl/olive material system is live (4cf6e9e). Priority 2A mobile polish is done (1fa3cb4).
Material system: forest=world, pearl=reading, olive=labels/secondary, gold=accent only.
Orbit: ORBIT_SPEED 0.09, pulse 5s. Do not change page background, orbit fills, or glow unless I ask.
Next work is Priority 2B: content system (spreadsheet + ecosystem guides).
```

### Priority 2B content pass

```text
Priority 2B only — operating spreadsheet structure and first ecosystem guide planning/content.
No homepage UI changes unless Jai asks. No scores, ratings, or badge language.
```

---

## One-Line Status

**Pearl/olive on main (`4cf6e9e`); Priority 2A mobile calm polish done and pushed (`1fa3cb4`); next work is Priority 2B content system — spreadsheet + ecosystem guides.**
