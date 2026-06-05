# Discoveries

One JSON file per discovery. Rebecca edits these files. Session 3 reads them for the page.

## File naming

`{slug}.json` — example: `desk-plants-mini-harlow.json`

Add the slug to `DISCOVERY_SLUGS` in `data/index.ts` when you add a new file.

## Required fields

| Field | Example | Notes |
|-------|---------|-------|
| `id` | `desk-plants-mini-harlow` | Stable ID |
| `slug` | `desk-plants-mini-harlow` | URL path in Session 3 |
| `type` | `product` | product · package · guide · supplier · room · local · event |
| `title` | `Desk Plants — Mini Harlow` | Display name |
| `room` | `office` | sleep · kitchen · office · bathroom · land · community |
| `system` | `plants` | Sub-group inside the room |
| `alternative_to` | `["Plastic desk decor"]` | What this replaces — the Greenroad engine |
| `problem_solved` | string array | Section 1 |
| `why_we_like_it` | string array | Section 2 |
| `considerations` | string array | Section 3 |
| `evidence` | string array | Section 4 |
| `what_people_are_saying` | `{ loved_for, criticized_for }` | Section 5 |
| `signals_from_web` | `{ source, signal }[]` | Section 6 — curator mode, not scores |
| `supplier_id` | `desk-plants` | Links to `data/suppliers/` |
| `hero_image` | `/discoveries/...jpg` | Place in `public/discoveries/` |
| `seo_title` | | Search intent headline |
| `seo_description` | | Meta description |
| `faqs` | `{ q, a }[]` | Optional |
| `commerce` | see below | Stripe fields filled in Session 7 |
| `featured` | `true` / `false` | Homepage card candidate |
| `published` | `false` until ready | Gate live pages |

## Commerce object (placeholders until Session 7)

```json
{
  "bucket": "direct",
  "sale_type": "direct_resale",
  "list_price": null,
  "greenroad_price": null,
  "stripe_price_id": null,
  "affiliate_url": null,
  "product_url": "https://..."
}
```

## Never include

- sustainability score
- wellness score
- affiliate score
- Greenroad Approved / Certified labels

## TypeScript types

See `data/types/discovery.ts`. Loader: `data/index.ts`.
