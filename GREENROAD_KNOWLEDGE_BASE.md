# Greenroad Knowledge Base

## Positioning

Greenroad is a **trusted curator of sustainable living systems** — a field guide and discovery operating system for living well.

Greenroad is **not** a scoring site, review site, certification authority, or marketplace-first experience. We guide; we do not judge. No scores, ratings, or approved/certified badge language.

---

## Primary entity: Discovery

Not product. Not article. Not supplier. **Discovery.**

Types: `product` | `package` | `guide` | `supplier` | `room` | `local` | `event`

## Context blocks (every discovery page)

1. Problem Solved
2. Why We Like It
3. Considerations
4. Evidence
5. What People Are Saying (Loved For / Criticized For)
6. Signals From Around The Web

**Never show:** sustainability score, wellness score, affiliate score, Greenroad Approved, Greenroad Certified.

Signals are curator mode, not judge mode.

---

## Content strategy — ecosystem guides first

Do not build articles around products first. Build around **systems** first.

People want better sleep, mornings, kitchens, homes, and routines — not isolated product headlines.

**Priority guide ideas:**
- Sustainable Sleep Ecosystem
- Sustainable Coffee Ecosystem
- Sustainable Kitchen Ecosystem
- Sustainable Cleaning Ecosystem
- Sustainable Lighting Ecosystem
- Sustainable Hosting Ecosystem
- Non-Toxic Home Basics

The guide is the story. Products are supporting evidence.

---

## Rooms (orbit navigation)

```
Sleep      → Bedroom systems
Kitchen    → Coffee, storage, hosting, cleaning
Office     → Plants, circadian light, focus, ergonomics, air
Bathroom   → Hygiene, cleaning
Land       → Lawn, garden, outdoor
Community  → Post-V1
```

Folder structure: `data/rooms/{sleep,office,kitchen,bathroom,land,community}/`

---

## Zeyoda → Greenroad mapping

| Artistocks | Greenroad |
|------------|-----------|
| Featured Asset (#1) | Featured Discovery |
| Coin orbit = artists | Room orbit |
| Wallet = identity + holdings | Wallet = "Your Green Road" |
| Chat / search | Explore · Learn · Buy |

---

## Commerce buckets

| Bucket | V1 role |
|--------|---------|
| Direct (Desk Plants, Velocity) | Sell first — Stripe Session 7 |
| Warm (Mom's Velocity network) | Curate manually |
| Affiliate (EGO, Betterway, etc.) | Publish, link out |
| Greenroad originals | Post-V1 |

---

## First discovery

**Desk Plants** — Office → Plants system. Everyone understands it immediately. Teaches how Greenroad works.

First live page: **Desk Plants discovery only** (not Office Package as first page).

Focus Office Package: showcase only in V1.

---

## Content sources

- Product sheet: `https://docs.google.com/spreadsheets/d/1uagd6N0Yv_6NqTckyfuOkFMe2hdp0ypJC1xnf-yHlpQ/edit`
- Tabs: `products` (13 rows), `sleep eco` (6 rows, has scores — do not port scores), `OKRs`
- 13 Google Doc articles exist; Rebecca adding Desk Plants row
- Desk Plants catalog: 39 SKUs via deskplants.com

---

## First operating spreadsheet (90-day OS)

Three tabs to create:

**Products:** Product | Ecosystem | Problem Solved | Why We Like It | Considerations | Evidence | Supplier | Status | Publish Priority

**Suppliers:** Brand | Contact | Product Category | Relationship Strength | Outreach Status | Notes

**Guides:** Guide Title | Ecosystem | Status | Publish Priority | Products Needed | Notes

---

## Future field (sheet + schema)

**Alternative To** — e.g. Desk Plants → "Plastic desk decor"

---

## Do not build in V1

Sustainability scoring, approval badges, affiliate scores visible to users, party line, supplier portal, Telegram/GOSHBOT, Magic.link auth, Venmo/PayPal live rails, full 39-SKU import, full 13-article publish at once.

---

## Material system (live on main — commit 4cf6e9e)

See `app/styles/tokens.css` and `GREENROAD_MEMORY.md` for full handoff.

```text
Forest = world / background / orbit / chrome
Pearl  = primary reading surface
Olive  = labels + secondary cards
Gold   = trim / buttons / reward (NOT body text on pearl or olive)
```

### Key tokens

| Token | Value |
|-------|-------|
| `--print-pearl` | `#f5f0e6` |
| `--print-olive` | `#b8ba84` |
| `--ink` | `var(--green-deep)` |
| `--green-deep` | `#1a4a2e` |
| `--gold-lion` | `#c9a84c` |

### Rules

1. No gold body/title text on pearl or olive
2. No olive long-form reading surfaces
3. No full-page sage/olive background
4. Forest world (page, orbit, glow, wallet, search) unchanged unless explicitly asked

### Surfaces on main

| Surface | Material |
|---------|----------|
| Featured card body | Pearl + ink |
| Ecosystem badge | Olive + ink |
| Accordion open panels | Pearl + ink, gold frame |
| Signal cards | Olive + ink |
| Continue Exploring cards | Olive + ink |
| Page / orbit / search | Forest (unchanged) |

Print tokens are CSS variables only — not yet in Tailwind `@theme`.

---

## Current git state

```text
main = 4cf6e9e — Refine Greenroad pearl and olive material system
build passed, working tree clean
experiment/pearl-print-surface is historical, not active
```

**Next work:** Priority 2A — mobile calm + readability polish (orbit speed, small text, section spacing, quieter command search). No new colors or features.

---

## Sovereign instance

Independent codebase, data, branding, env from Zeyoda. Borrow navigation patterns only.
