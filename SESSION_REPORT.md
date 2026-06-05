# Session Report — Session 3

**Date:** 2026-06-05  
**Scope:** Homepage as first discovery experience — trust milestone.  
**Status:** Complete

## Built

| Section | Component |
|---------|-----------|
| Story banner | `StoryBanner.tsx` |
| Wallet top-left | `GreenroadWallet.tsx` |
| Featured Desk Plants | `FeaturedDiscovery.tsx` + `OvalGlowBackdrop.tsx` |
| Ecosystem orbit (6 nodes) | `EcosystemOrbit.tsx` |
| Six context accordions | `DiscoveryAccordions.tsx` |
| Continue Exploring (3 placeholders) | `ContinueExploring.tsx` |
| Bottom search shell | `CommandSearch.tsx` |
| Page orchestration | `HomePage.tsx`, `app/page.tsx` |
| Styles | `app/styles/home.css` |
| Ecosystem definitions | `data/ecosystems.ts` |

## Data

All accordion content loaded from `getDiscovery("desk-plants-mini-harlow")`.

## Locked in this session

- Homepage = discovery experience (not separate marketing page)
- Wallet top-left — ecosystem infrastructure position
- Rooms = ecosystems (UI copy)
- Continue Exploring (not Recent Discoveries)
- Join The Green Road (not Sign Up)
- Conservatory feel — curiosity before commerce
- No scores, no buy button, no Stripe

## Trust check (Jai)

Open greenroad.group on your phone. Ask: does a stranger think "I trust these people"?

## Not built (intentional)

- Stripe / buy button
- Email backend
- Magic.link
- GPT search (input is read-only shell)
- Orbit changing featured discovery on tap (static V1)

## Stop line

Session 3 complete. Do not begin Session 4 until Jai says so.
