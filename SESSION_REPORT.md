# Session Report — Session 3A (Experience Pass)

**Date:** 2026-06-05  
**Scope:** Experience polish — hero image, orbit wraps discovery, live interactions, search.  
**Status:** Complete

## Built

| Priority | Delivered |
|----------|-----------|
| Hero image | `public/discoveries/desk-plants-mini-harlow-hero.jpg` (Desk Plants Mini Harlow Cream, supplier photo) + `next/image` wiring + emerald/gold fallback |
| Orbit around discovery | `discovery-stage` — orbit ring + featured card share one container (Zeyoda pattern) |
| Coming Into View | Tap non-Office ecosystems → ecosystem tagline + copy; Office → Desk Plants |
| Join The Green Road | Scroll to command bar + focus email field |
| Search | Local discovery search over JSON fields + ecosystem matching; result list |
| Continue Exploring | Cards tap → switch ecosystem / scroll to stage |

## New / updated files

- `public/discoveries/desk-plants-mini-harlow-hero.jpg`
- `data/discoverySearch.ts`
- `data/ecosystems.ts` (coming_into_view copy per ecosystem)
- `app/components/home/EcosystemOrbitRing.tsx`
- `app/components/home/HomePage.tsx`
- `app/components/home/FeaturedDiscovery.tsx`
- `app/components/home/CommandSearch.tsx`
- `app/components/home/ContinueExploring.tsx`
- `app/styles/home.css`

## Trust check (Jai)

Open greenroad.group on phone. Ask: does a stranger immediately understand what Greenroad is, why Desk Plants is here, what ecosystems mean, and how to begin?

## Not built (intentional)

Stripe, Magic.link, email backend, multi-discovery swipe carousel, GOSHBOT

## Stop line

Session 3A complete.
