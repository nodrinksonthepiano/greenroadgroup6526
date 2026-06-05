# Agent Notes

## Session discipline

Begin every build session with:

> We are building one thing today. When it is complete we stop. Do not add anything I didn't ask for.

**One session = one scope.** Stop when done. Do not start the next session unless Jai says so.

## Git

**Jai handles all git.** Agent does not commit, push, or configure remotes unless explicitly asked.

## Session 1 complete (2026-06-05)

Created:
- Next.js 15 scaffold (`greenroadgroup6526`)
- Design tokens + color system (`app/styles/tokens.css`)
- Fonts: Cormorant Garamond + Inter (`app/layout.tsx`)
- Folder structure: `data/discoveries`, `data/suppliers`, `data/rooms/*`
- Memory docs: VOICE_AND_VISION, GREENROAD_KNOWLEDGE_BASE, PRD.json, LAUNCH_ROADMAP, SESSION_REPORT
- Empty page (no UI — Session 1 spec)

**Not started:** Session 2 (Desk Plants JSON), Session 3 (discovery page).

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

Create Vercel project **after** first local run + git push. Order: scaffold → local runs → commit → push → Vercel import → connect greenroad.group.
