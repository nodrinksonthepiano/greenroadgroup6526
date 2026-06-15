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

## Git

**Jai handles all git.** Agent does not commit, push, or configure remotes unless explicitly asked.

## Current state (June 15, 2026)

```text
Active branch:  main
Commit:         af1060d — Revert "Add Custom as 7th Room/orbit coin and Custom Patches & Stickers discovery"
origin/main:    af1060d (up to date after revert)
Build:          passed before 2A commit; not rerun during memory cleanup
Working tree:   clean
```

**Do not use** `experiment/pearl-print-surface` as the active branch. Pearl/olive is merged to main. That experiment branch is historical.

The reverted custom-goods work exists in commit `fdb2169`, but it is not an approved active branch/work path. Do not reuse it blindly.

**Read first:** `GREENROAD_MEMORY_MAP.md`, then `GREENROAD_MEMORY.md`

**Next work:** memory/PRD cleanup only — `GREENROAD_MEMORY.md`, `VOICE_AND_VISION.md`, `PRD.json`, `LAUNCH_ROADMAP.md`, then `SESSION_REPORT.md`. No homepage/code changes from this task.

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
2. Merchant of record on Stripe (Greenroad LLC ready?)
3. Rebecca/Jai can place Desk Plants orders at NET without Mom per sale?

## Vercel

Site live at `greenroad.group`. Vercel deploys from `main`. Redeploy follows push to origin/main.
