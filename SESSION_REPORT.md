# Session Report

---

## Session 3A — Experience Pass (2026-06-05)

**Scope:** Experience polish — hero image, orbit wraps discovery, live interactions, search.  
**Status:** Complete

### Built

| Priority | Delivered |
|----------|-----------|
| Hero image | `public/discoveries/desk-plants-mini-harlow-hero.jpg` + `next/image` + emerald/gold fallback |
| Orbit around discovery | `discovery-stage` — orbit ring + featured card share one container |
| Coming Into View | Tap non-Office ecosystems → tagline + copy; Office → Desk Plants |
| Join The Green Road | Scroll to command bar + focus email field |
| Search | Local discovery search over JSON fields + ecosystem matching |
| Continue Exploring | Cards tap → switch ecosystem / scroll to stage |

### Not built (intentional)

Stripe, Magic.link, email backend, multi-discovery swipe carousel, GOSHBOT

---

## Header Polish (`13df07d`)

**Date:** 2026-06-05  
**Scope:** Header layering and featured discovery copy  
**Status:** Complete

### Changed

- `app/components/home/FeaturedDiscovery.tsx` — copy refinements
- `app/components/home/HomePage.tsx` — header layering
- `app/styles/home.css` — header spacing
- `data/discoveries/desk-plants-mini-harlow.json` — hook copy
- `data/types/discovery.ts` — type field addition

---

## Pearl/Olive Material System (`4cf6e9e`)

**Date:** 2026-06-05 (merged to main)  
**Scope:** Print material system for homepage reading surfaces  
**Status:** Complete — live on main, build passed

### What changed

| File | Change |
|------|--------|
| `app/styles/tokens.css` | Added `--print-pearl`, `--print-olive`, `--ink`, `--ink-muted` |
| `app/styles/home.css` | Migrated featured body, badge, accordions, signals, continue-exploring to print system |

### Material rules applied

```text
Forest = world (unchanged)
Pearl  = featured body, accordion open panels
Olive  = ecosystem badge, signal cards, continue-exploring cards
Gold   = borders, buttons, accordion trim (not body text on print surfaces)
```

### Rejected (do not retry without ask)

- Full-page sage/olive background
- Olive as main card reading body
- Gold title/body text on pearl or olive

### Not changed

Page background, orbit coin fills, glow, wallet, command search chrome, accordion closed triggers (silver on forest).

### Trust check (Jai)

Open greenroad.group on phone. Pearl card should read clearly. Olive badge and explore cards should feel secondary. Forest world should feel calm around the reading surfaces.

---

## Priority 2A — Mobile Calm + Orbit Readability (`1fa3cb4`)

**Date:** 2026-06-08  
**Scope:** Mobile calm + readability polish — CSS/constants only  
**Status:** Complete — committed and pushed to main

### Delivered

| Change | Before | After |
|--------|--------|-------|
| Orbit rotation | `ORBIT_SPEED` 0.3 | **0.09** |
| Coin pulse | 2s | **5s** |
| Orbit labels (mobile) | 0.58rem / 0.52rem | **0.625rem / 0.58rem** |
| Section spacing | tight | More breathing room: stage → hint → Discovery Context → Continue Exploring |
| Command search | loud gradient/chrome | Softened gradient, input, focus ring |

### Files changed

- `app/components/home/EcosystemOrbitRenderer.tsx`
- `app/styles/ecosystem-orbit.css`
- `app/styles/home.css`

### Not changed

Colors, material system, page background, orbit fills, glow, wallet, new features, Stripe, new pages.

Build passed before commit.

---

## Next — Priority 2B: Content System

1. Memory + operating-system cleanup
2. Existing Google Sheet tabs
3. Google Sheets MCP after sheet structure
4. Site/code later

See `GREENROAD_MEMORY.md` and `LAUNCH_ROADMAP.md`.

---

## Strategy Correction + Memory Cleanup (2026-06-15)

**Scope:** Project brain cleanup only — docs/memory/PRD/roadmap alignment.  
**Status:** Complete

### Current truth recorded

```text
Greenroad = everyday goods + greener systems + custom goods.
Sustainability = the north star.
Custom Goods = money-now lane, not the whole identity.
Thoughtful everyday goods = trust/content engine.
```

The existing Greenroad Google Sheet is the control board. Do not create a separate custom goods sheet yet.

ZEYODA is internal-only parent/foundation memory and should not appear in public Greenroad copy unless Jai explicitly approves.

GOSHBOT routes memory and warns about drift.

### Docs updated

| File | Update |
|------|--------|
| `GREENROAD_MEMORY_MAP.md` | Created memory router for Greenroad, ZEYODA, Artistocks, ArtisTalks, GOSHBOT, shared patterns, and operations |
| `AGENT_NOTES.md` | Updated read-first guidance and current state (`af1060d`) |
| `GREENROAD_MEMORY.md` | Updated strategy, current git truth, existing sheet control board, MCP status, custom-goods strategy, Becca role |
| `VOICE_AND_VISION.md` | Updated voice: everyday/thoughtful goods, curated commerce with purpose, custom-goods lane, public ZEYODA boundary |
| `PRD.json` | Updated and validated; added work sequence and active work items |
| `LAUNCH_ROADMAP.md` | Updated next phases: memory, existing sheet, ADG sorting, starter offers, surgical site update, manual proof flow, later listings/checkout |

### Custom Goods notes

- Custom Goods is the money-now lane, not the whole identity.
- The ADG `POD Adventure Brite Stainless Tumbler 20 oz` is a strong starter candidate and proof-preview example, not the whole custom strategy.
- Patches and stickers should stay separate product types under Custom, not one forced combined product card.
- Avoid using "better goods" as the main Greenroad phrase. Prefer everyday goods, thoughtful goods, useful goods, responsible goods, greener systems, custom goods, and curated commerce with purpose.

### Next order

1. Add tabs to the existing Greenroad Google Sheet: Custom Goods, ADG Items, First Offers, Questions
2. Sort ADG / promo-on-demand products inside the existing control board
3. Resume Google Sheets MCP only after sheet structure is clear
4. Site/code later, after docs and sheet are coherent

### Not changed

Homepage/code, colors, material system, page background, orbit fills, glow, wallet, Stripe, checkout, proof editor, full catalog, MCP setup.
