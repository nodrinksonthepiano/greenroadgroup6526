# Greenroad Knowledge Base

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

## Zeyoda → Greenroad mapping

| Artistocks | Greenroad |
|------------|-----------|
| Featured Asset (#1) | Featured Discovery |
| Coin orbit = artists | Room orbit |
| Wallet = identity + holdings | Wallet = "Your Green Road" |
| Chat / search | Explore · Learn · Buy |

## Commerce buckets

| Bucket | V1 role |
|--------|---------|
| Direct (Desk Plants, Velocity) | Sell first — Stripe Session 7 |
| Warm (Mom's Velocity network) | Curate manually |
| Affiliate (EGO, Betterway, etc.) | Publish, link out |
| Greenroad originals | Post-V1 |

## First discovery

**Desk Plants** — Office → Plants system. Everyone understands it immediately. Teaches how Greenroad works.

First live page: **Desk Plants discovery only** (not Office Package as first page).

Focus Office Package: showcase only in V1.

## Content sources

- Product sheet: `https://docs.google.com/spreadsheets/d/1uagd6N0Yv_6NqTckyfuOkFMe2hdp0ypJC1xnf-yHlpQ/edit`
- Tabs: `products` (13 rows), `sleep eco` (6 rows, has scores — do not port scores), `OKRs`
- 13 Google Doc articles exist; Rebecca adding Desk Plants row
- Desk Plants catalog: 39 SKUs via deskplants.com

## Future field (sheet + schema)

**Alternative To** — e.g. Desk Plants → "Plastic desk decor"

## Do not build in V1

Sustainability scoring, approval badges, affiliate scores visible to users, party line, supplier portal, Telegram/GOSHBOT, Magic.link auth, Venmo/PayPal live rails, full 39-SKU import, full 13-article publish at once.

## Color tokens

See `app/styles/tokens.css`

## Sovereign instance

Independent codebase, data, branding, env from Zeyoda. Borrow navigation patterns only.
