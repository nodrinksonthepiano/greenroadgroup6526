# Suppliers

One JSON file per supplier. Referenced by `supplier_id` on discoveries.

## Current suppliers

| ID | File |
|----|------|
| `desk-plants` | `desk-plants.json` |

## Fields

| Field | Notes |
|-------|-------|
| `id` | Matches `supplier_id` on discoveries |
| `name` | Display name |
| `location` | City, state |
| `website` | Primary URL |
| `relationship` | direct · warm · affiliate |
| `via` | Intro path (e.g. velocity) or null |
| `story` | Short supplier story |
| `capabilities` | e.g. engraving, drop_ship |
