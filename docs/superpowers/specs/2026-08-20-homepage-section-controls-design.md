# Homepage Section Controls — Design

Date: 2026-08-20
Status: Approved in chat; pending user spec review

## Goal

Give the store owner full control over the homepage composition from the admin
panel. The owner can:

- Toggle the visibility of every existing main section (Hero, Categories,
  Product grid, Promo banner, Best products).
- Add, edit, delete, and reorder custom sections.
- Custom sections come in two types: **Banner** (image + title + subtitle +
  button) and **Image grid** (2–8 tiles of image + label + link).
- Banners have three sizes: **Small**, **Medium**, **Large**.
- The header and footer are always visible and are not part of the toggleable
  sections.

## Data model

### `settings` table (existing key-value table)

New key: `homepage_sections`

- Value is a JSON array of ordered section entries:
  `[{ "id": "hero", "visible": true }, ...]`
- Fixed section ids: `hero`, `categories`, `products`, `promo`, `best`
- Custom section ids: `sec:<uuid>` (data lives in the `sections` table)
- Array order = homepage display order. `visible` controls on/off.
- When the key is missing, defaults to all fixed sections in the default order
  followed by any custom sections that exist.

Removed keys: `banner_image`, `banner_title`, `banner_subtitle`,
`banner_button_text`, `banner_button_link` (replaced by custom sections).

Kept keys from the previous work: `brand_logo`, `hero_image`, and all existing
store/brand/contact keys.

### New `sections` table

```sql
CREATE TABLE IF NOT EXISTS sections (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,                 -- 'banner' | 'grid'
  name        TEXT NOT NULL,                 -- admin-facing label
  size        TEXT NOT NULL DEFAULT 'medium',-- 'small' | 'medium' | 'large'
  image_url   TEXT,
  title       TEXT,
  subtitle    TEXT,
  button_text TEXT,
  button_link TEXT,
  grid_items  TEXT,                          -- JSON array of {image,label,link}
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- Table is created in `setupDatabase.ts` (schema) and in the admin `ensureSchema`
  helper so it exists on already-provisioned databases.
- `grid_items` is a JSON string parsed at render time.

## Admin UI (Settings tab → "Controls")

### Homepage sections list

A single ordered list of all sections. Each row shows:

- Name (fixed: "Hero", "Categories", "Product grid", "Promo banner",
  "Best products"; custom: the section's `name`).
- Type/size badges for custom sections (e.g. "Banner · Medium", "Grid").
- A **visibility toggle** (switch) that flips `visible` in `homepage_sections`.
- **Up / Down** buttons to reorder (mutates the `homepage_sections` array).
- Custom sections only: **Edit** and **Delete** buttons.

### Add / Edit section modal

Fields:

- Name (required)
- Type: Banner | Image grid
- Size (banner only): Small | Medium | Large
- Image URL (banner required to render)
- Title, Subtitle (banner)
- Button text, Button link (banner; default button text "Shop Now", link "/shop")
- Grid tiles (grid type): dynamic list of 2–8 tiles, each with image URL, label,
  and link.

Save behavior:

- Add: insert into `sections` table, append `{ id: "sec:<uuid>", visible: true }`
  to `homepage_sections`, save settings.
- Edit: update the `sections` row.
- Delete: delete the `sections` row and remove its entry from `homepage_sections`.
- Toggle/reorder: save updated `homepage_sections` to settings.

## Landing page rendering (`Index.tsx`)

- Reads `settings.homepage_sections` (parsed JSON) and the `sections` table.
- Renders each entry in order, skipping entries where `visible` is false or the
  referenced section no longer exists.
- Fixed id → component mapping:

  | id           | component          |
  | ------------ | ------------------ |
  | `hero`       | `<Hero />`         |
  | `categories` | `<Categories />`   |
  | `products`   | `<ProductGrid />`  |
  | `promo`      | `<PromoBanner />`  |
  | `best`       | `<BestProducts />` |

- Custom id → `<SectionBanner />` or `<SectionGrid />` depending on `type`.
- SiteHeader and SiteFooter always render.

## New components

### `src/components/SectionBanner.tsx`

Renders a banner section from section data. Sizes:

- **Large**: tall hero-like section (min-h ~80vh), centered content over the
  background image.
- **Medium**: current promo-banner style (constrained height, content card on
  one side).
- **Small**: slim strip with a compact text row.

Image is the background with an overlay; title, subtitle, and button render over
it. If no image is set, the section does not render.

### `src/components/SectionGrid.tsx`

Renders a responsive grid (2–4 columns depending on tile count) of tiles. Each
tile is a link containing the image, with the label overlaid or below the image.

### `src/components/admin/ControlsManager.tsx`

The admin UI described above. Includes the sections list, add/edit modal, and
the logic to persist to the `sections` table and `homepage_sections` setting.

## Removal

- `src/components/ExtraBanner.tsx` — removed; replaced by custom banner sections.
- The "Extra banner" group in the admin settings form — removed.
- The `banner_*` keys in `useSettings.tsx` defaults — removed.
- `ExtraBanner` import/usage in `Index.tsx` — removed.

## Error handling

- Parsing failures for `homepage_sections` / `grid_items` fall back to safe
  defaults (default order / empty grid) rather than crashing the page.
- DB write errors surface via the existing `toast.error` pattern used throughout
  the admin panel.

## Verification

- `npx tsc --noEmit` passes.
- `npm run lint` passes (no new errors).
- `npm run build` succeeds.
- Manual check: add, edit, delete, reorder, and toggle sections in the admin;
  confirm the homepage renders the correct visible sections in the correct order
  at all three banner sizes and the grid type.
