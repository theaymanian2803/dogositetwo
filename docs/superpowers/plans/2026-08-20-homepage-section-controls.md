# Homepage Section Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin full control over homepage composition — toggle existing sections on/off, reorder them, and add custom Banner (3 sizes) and Image grid sections.

**Architecture:** A new `sections` table stores custom section data; a `homepage_sections` settings key stores the ordered, visibility-flagged list of ALL homepage sections (fixed ids + `sec:<uuid>` custom ids). `Index.tsx` renders sections from this ordered list via a `useSections()` hook. A new `ControlsManager` component in the admin Settings tab handles add/edit/delete/reorder/toggle.

**Tech Stack:** React 19 + Vite 7, TypeScript 5, Tailwind CSS v4, Turso/libSQL (`@libsql/client/web`), React Router, lucide-react, sonner (toasts).

**Spec:** `docs/superpowers/specs/2026-08-20-homepage-section-controls-design.md`

## Global Constraints

- No test framework exists in this repo (no vitest/jest). Verification is via `& "node_modules/.bin/tsc.exe" --noEmit`, `npx eslint <changed files>`, and `npm run build`.
- `npx tsc` does NOT resolve in this repo (npx resolves a wrong package). Always use the local binary: `& "node_modules/.bin/tsc.exe" --noEmit`.
- The repo is Windows + PowerShell. Commands like `cmd1; if ($?) { cmd2 }` chain sequentially.
- Repo files use CRLF but prettier expects LF. After editing any `.ts/.tsx` file, run `npx prettier --write <file>` to normalize formatting and keep `eslint` (prettier rule) green.
- The demo database may not have the `sections` table yet; all `sections` queries must tolerate a missing table (try/catch) until `ensureSchema` creates it.
- Commits happen only when the user explicitly approves them; run the git add/commit steps only after asking.

---

### Task 1: Shared sections library

**Files:**

- Create: `src/lib/sections.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type SectionSize = "small" | "medium" | "large"`
  - `type SectionType = "banner" | "grid"`
  - `type GridItem = { image: string; label: string; link: string }`
  - `type Section = { id: string; type: SectionType; name: string; size: SectionSize; image_url: string; title: string; subtitle: string; button_text: string; button_link: string; grid_items: GridItem[] }`
  - `type SectionEntry = { id: string; visible: boolean }`
  - `type SectionRow = { id: string; visible: boolean; isCustom: boolean; section: Section | null }`
  - `const FIXED_SECTION_IDS: readonly string[]` (`["hero","categories","products","promo","best"]`)
  - `const FIXED_SECTION_LABELS: Record<string, string>`
  - `parseGridItems(raw: string | null): GridItem[]`
  - `parseSectionsOrder(raw: string | null, custom: Section[]): SectionEntry[]`
  - `serializeSectionsOrder(entries: SectionEntry[]): string`
  - `sectionFromRow(row: Record<string, unknown>): Section`
  - `mapSectionsToRows(custom: Section[], orderRaw: string | null): SectionRow[]`

- [ ] **Step 1: Create the file**

Create `src/lib/sections.ts` with this exact content:

```ts
export type SectionSize = "small" | "medium" | "large";
export type SectionType = "banner" | "grid";

export type GridItem = { image: string; label: string; link: string };

export type Section = {
  id: string;
  type: SectionType;
  name: string;
  size: SectionSize;
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  grid_items: GridItem[];
};

export type SectionEntry = { id: string; visible: boolean };

export type SectionRow = {
  id: string;
  visible: boolean;
  isCustom: boolean;
  section: Section | null;
};

export const FIXED_SECTION_IDS = ["hero", "categories", "products", "promo", "best"] as const;

export const FIXED_SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  categories: "Categories",
  products: "Product grid",
  promo: "Promo banner",
  best: "Best products",
};

export function parseGridItems(raw: string | null): GridItem[] {
  try {
    const arr = JSON.parse(raw ?? "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x: unknown) => x && typeof x === "object")
      .map((x) => ({
        image: String((x as GridItem).image ?? ""),
        label: String((x as GridItem).label ?? ""),
        link: String((x as GridItem).link ?? ""),
      }));
  } catch {
    return [];
  }
}

export function parseSectionsOrder(raw: string | null, custom: Section[]): SectionEntry[] {
  let parsed: SectionEntry[] | null = null;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        parsed = arr
          .filter((x: unknown) => x && typeof x === "object")
          .map((x) => ({
            id: String((x as SectionEntry).id),
            visible: (x as SectionEntry).visible !== false,
          }));
      }
    } catch {
      parsed = null;
    }
  }
  const base: SectionEntry[] = parsed ?? FIXED_SECTION_IDS.map((id) => ({ id, visible: true }));
  const existing = new Set(base.map((e) => e.id));
  for (const s of custom) {
    const id = `sec:${s.id}`;
    if (!existing.has(id)) base.push({ id, visible: true });
  }
  return base;
}

export function serializeSectionsOrder(entries: SectionEntry[]): string {
  return JSON.stringify(entries);
}

export function sectionFromRow(row: Record<string, unknown>): Section {
  return {
    id: String(row.id ?? ""),
    type: row.type === "grid" ? "grid" : "banner",
    name: String(row.name ?? ""),
    size: row.size === "small" || row.size === "large" ? row.size : "medium",
    image_url: String(row.image_url ?? ""),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    button_text: String(row.button_text ?? ""),
    button_link: String(row.button_link ?? ""),
    grid_items: parseGridItems(String(row.grid_items ?? "[]")),
  };
}

export function mapSectionsToRows(custom: Section[], orderRaw: string | null): SectionRow[] {
  const entries = parseSectionsOrder(orderRaw, custom);
  return entries.map((e) => {
    if (e.id.startsWith("sec:")) {
      const section = custom.find((s) => `sec:${s.id}` === e.id) ?? null;
      return { id: e.id, visible: e.visible, isCustom: true, section };
    }
    return { id: e.id, visible: e.visible, isCustom: false, section: null };
  });
}
```

- [ ] **Step 2: Verify types and formatting**

Run: `npx prettier --write src/lib/sections.ts; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: prettier formats the file; `tsc` reports no errors.

- [ ] **Step 3: Lint**

Run: `npx eslint src/lib/sections.ts`
Expected: 0 errors.

- [ ] **Step 4: Commit (after asking user)**

```bash
git add src/lib/sections.ts
git commit -m "feat: add shared sections library"
```

---

### Task 2: Add `sections` table to schema

**Files:**

- Modify: `src/lib/setupDatabase.ts` (SCHEMA_SQL template string, after the `orders` table definition ~line 65)
- Modify: `src/pages/Admin.tsx` (`ensureSchema`, after the `settings` CREATE TABLE ~line 302)

**Interfaces:**

- Consumes: nothing new.
- Produces: `sections` table available on any freshly-provisioned DB and on the demo DB once the admin loads.

- [ ] **Step 1: Add table to `setupDatabase.ts`**

Inside the `SCHEMA_SQL` template literal, after the `orders` table block (line 65 ends with `);`), append:

```sql
CREATE TABLE IF NOT EXISTS sections (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  size        TEXT NOT NULL DEFAULT 'medium',
  image_url   TEXT,
  title       TEXT,
  subtitle    TEXT,
  button_text TEXT,
  button_link TEXT,
  grid_items  TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Add table to admin `ensureSchema`**

In `src/pages/Admin.tsx`, inside `ensureSchema`, right after the `settings` CREATE TABLE statement (currently ends with `` `); `` around line 307), add:

```ts
await turso.execute(`
  CREATE TABLE IF NOT EXISTS sections (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    size        TEXT NOT NULL DEFAULT 'medium',
    image_url   TEXT,
    title       TEXT,
    subtitle    TEXT,
    button_text TEXT,
    button_link TEXT,
    grid_items  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

- [ ] **Step 3: Format and verify**

Run: `npx prettier --write src/lib/setupDatabase.ts src/pages/Admin.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: format applied; tsc passes.

- [ ] **Step 4: Lint**

Run: `npx eslint src/lib/setupDatabase.ts src/pages/Admin.tsx`
Expected: 0 errors (a pre-existing `react-hooks/exhaustive-deps` warning on line ~358 of Admin.tsx is acceptable).

- [ ] **Step 5: Commit (after asking user)**

```bash
git add src/lib/setupDatabase.ts src/pages/Admin.tsx
git commit -m "feat: add sections table to schema"
```

---

### Task 3: Rework settings defaults and remove the old extra banner

**Files:**

- Modify: `src/hooks/useSettings.tsx` (defaultSettings)
- Modify: `src/pages/Admin.tsx` (settingsLabels, settingsGroups, settingsTextareas)
- Delete: `src/components/ExtraBanner.tsx`
- Modify: `src/pages/Index.tsx` (remove ExtraBanner import + usage)

**Interfaces:**

- Consumes: nothing new.
- Produces: `settings.homepage_sections` (string, default JSON of the 5 fixed sections, all visible); no more `settings.banner_*`.

- [ ] **Step 1: Update `useSettings.tsx` defaults**

Replace the block from `hero_image:` through the `banner_*` keys so it becomes:

```ts
  hero_image: "",
  homepage_sections:
    '[{"id":"hero","visible":true},{"id":"categories","visible":true},{"id":"products","visible":true},{"id":"promo","visible":true},{"id":"best","visible":true}]',
} as const;
```

- [ ] **Step 2: Update `Admin.tsx` settings labels**

In `settingsLabels`, remove these five lines:

```ts
  banner_image: "Banner image URL",
  banner_title: "Banner title",
  banner_subtitle: "Banner subtitle",
  banner_button_text: "Banner button text",
  banner_button_link: "Banner button link",
```

- [ ] **Step 3: Update `Admin.tsx` settings groups**

In `settingsGroups`, remove the entire "Extra banner" group:

```ts
  {
    title: "Extra banner",
    fields: [
      "banner_image",
      "banner_title",
      "banner_subtitle",
      "banner_button_text",
      "banner_button_link",
    ],
  },
```

- [ ] **Step 4: Update `settingsTextareas`**

Remove `"banner_subtitle",` from the `settingsTextareas` set.

- [ ] **Step 5: Remove the banner_image hint**

In the settings form render (around line 1646), remove the `banner_image` hint block:

```tsx
{
  key === "banner_image" && (
    <p className="text-[11px] text-muted-foreground">
      Leave the image empty to hide this section from the homepage.
    </p>
  );
}
```

- [ ] **Step 6: Delete `ExtraBanner.tsx` and remove it from `Index.tsx`**

Delete the file:

```bash
Remove-Item -LiteralPath "src\components\ExtraBanner.tsx"
```

In `src/pages/Index.tsx`, remove the import line `import { ExtraBanner } from "@/components/ExtraBanner";` and the `<ExtraBanner />` line inside `<main>`.

- [ ] **Step 7: Format and verify**

Run: `npx prettier --write src/hooks/useSettings.tsx src/pages/Admin.tsx src/pages/Index.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes (Index now renders fixed sections only; no references to `banner_*` or ExtraBanner remain).

- [ ] **Step 8: Lint**

Run: `npx eslint src/hooks/useSettings.tsx src/pages/Admin.tsx src/pages/Index.tsx`
Expected: 0 errors (pre-existing warnings acceptable).

- [ ] **Step 9: Commit (after asking user)**

```bash
git add src/hooks/useSettings.tsx src/pages/Admin.tsx src/pages/Index.tsx
git rm src/components/ExtraBanner.tsx
git commit -m "feat: add homepage_sections setting, remove legacy extra banner"
```

---

### Task 4: `useSections` hook

**Files:**

- Create: `src/hooks/useSections.tsx`

**Interfaces:**

- Consumes: `turso` from `@/integrations/turso/client`; `useSettings` from `@/hooks/useSettings`; `mapSectionsToRows`, `sectionFromRow`, `Section`, `SectionRow` from `@/lib/sections`.
- Produces:
  - `useSections(): { sections: Section[]; rows: SectionRow[]; refresh: () => Promise<void> }`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useSections.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { turso } from "@/integrations/turso/client";
import { useSettings } from "@/hooks/useSettings";
import type { Section, SectionRow } from "@/lib/sections";
import { mapSectionsToRows, sectionFromRow } from "@/lib/sections";

export function useSections() {
  const { settings } = useSettings();
  const [sections, setSections] = useState<Section[]>([]);

  const refresh = useCallback(async () => {
    try {
      const rs = await turso.execute("SELECT * FROM sections ORDER BY created_at");
      setSections(rs.rows.map((r) => sectionFromRow(r as unknown as Record<string, unknown>)));
    } catch {
      setSections([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = useMemo<SectionRow[]>(
    () => mapSectionsToRows(sections, settings.homepage_sections),
    [sections, settings.homepage_sections],
  );

  return { sections, rows, refresh };
}
```

- [ ] **Step 2: Format and verify**

Run: `npx prettier --write src/hooks/useSections.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes.

- [ ] **Step 3: Lint**

Run: `npx eslint src/hooks/useSections.tsx`
Expected: 0 errors (a react-refresh warning is acceptable — the file only exports a hook and is consistent with `useSettings.tsx`).

- [ ] **Step 4: Commit (after asking user)**

```bash
git add src/hooks/useSections.tsx
git commit -m "feat: add useSections hook"
```

---

### Task 5: `SectionBanner` render component

**Files:**

- Create: `src/components/SectionBanner.tsx`

**Interfaces:**

- Consumes: `Section` from `@/lib/sections`; `Link` from `react-router-dom`.
- Produces: `SectionBanner({ section }: { section: Section })` — returns `null` when `section.image_url` is empty.

- [ ] **Step 1: Create the component**

Create `src/components/SectionBanner.tsx`:

```tsx
import { Link } from "react-router-dom";
import type { Section } from "@/lib/sections";

export function SectionBanner({ section }: { section: Section }) {
  if (!section.image_url) return null;
  const sizeClass = {
    small: "py-10 md:py-14",
    medium: "py-16 md:py-24",
    large: "min-h-[70vh] py-24 md:py-32",
  }[section.size];
  return (
    <section className={`relative overflow-hidden bg-promo ${sizeClass}`}>
      <img
        src={section.image_url}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/25" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-start px-6">
        <div className="max-w-xl rounded-2xl bg-background/90 p-6 backdrop-blur-sm md:p-10">
          {section.title && <h3 className="text-2xl font-bold md:text-3xl">{section.title}</h3>}
          {section.subtitle && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {section.subtitle}
            </p>
          )}
          <Link to={section.button_link.trim() || "/shop"} className="btn-dark mt-6 inline-flex">
            {section.button_text.trim() || "Shop Now"}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Format and verify**

Run: `npx prettier --write src/components/SectionBanner.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes.

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/SectionBanner.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit (after asking user)**

```bash
git add src/components/SectionBanner.tsx
git commit -m "feat: add SectionBanner component"
```

---

### Task 6: `SectionGrid` render component

**Files:**

- Create: `src/components/SectionGrid.tsx`

**Interfaces:**

- Consumes: `Section` from `@/lib/sections`; `Link` from `react-router-dom`.
- Produces: `SectionGrid({ section }: { section: Section })` — returns `null` when no tiles have an image.

- [ ] **Step 1: Create the component**

Create `src/components/SectionGrid.tsx`:

```tsx
import { Link } from "react-router-dom";
import type { Section } from "@/lib/sections";

export function SectionGrid({ section }: { section: Section }) {
  const items = section.grid_items.filter((g) => g.image);
  if (items.length === 0) return null;
  const cols =
    items.length <= 2
      ? "sm:grid-cols-2"
      : items.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 md:grid-cols-4";
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      {section.title && (
        <h3 className="text-center text-2xl font-bold md:text-3xl">{section.title}</h3>
      )}
      {section.subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted-foreground md:text-base">
          {section.subtitle}
        </p>
      )}
      <div className={`mt-8 grid grid-cols-1 gap-4 ${cols}`}>
        {items.map((g, i) => (
          <Link
            key={i}
            to={g.link || "/shop"}
            className="group relative block overflow-hidden rounded-2xl"
          >
            <img
              src={g.image}
              alt={g.label || ""}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {g.label && (
              <span className="absolute inset-x-0 bottom-0 bg-foreground/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                {g.label}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Format and verify**

Run: `npx prettier --write src/components/SectionGrid.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes.

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/SectionGrid.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit (after asking user)**

```bash
git add src/components/SectionGrid.tsx
git commit -m "feat: add SectionGrid component"
```

---

### Task 7: Rework `Index.tsx` to render sections from settings

**Files:**

- Modify: `src/pages/Index.tsx`

**Interfaces:**

- Consumes: `useSections` from `@/hooks/useSections`; `SectionBanner` and `SectionGrid`; existing fixed components (`Hero`, `Categories`, `ProductGrid`, `PromoBanner`, `BestProducts`); `SiteHeader`, `SiteFooter`.
- Produces: homepage renders each visible section in `homepage_sections` order; header/footer always present.

- [ ] **Step 1: Rewrite the Index page**

Replace the entire `src/pages/Index.tsx`:

```tsx
import { BestProducts } from "@/components/BestProducts";
import { Categories } from "@/components/Categories";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { PromoBanner } from "@/components/PromoBanner";
import { SectionBanner } from "@/components/SectionBanner";
import { SectionGrid } from "@/components/SectionGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useSections } from "@/hooks/useSections";
import { useEffect } from "react";

export default function Index() {
  const { rows } = useSections();
  useEffect(() => {
    document.title = "PetPals — Premium Food & Supplies for Dogs and Cats";
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {rows.map((row) => {
          if (!row.visible) return null;
          if (row.isCustom) {
            if (!row.section) return null;
            return row.section.type === "grid" ? (
              <SectionGrid key={row.id} section={row.section} />
            ) : (
              <SectionBanner key={row.id} section={row.section} />
            );
          }
          switch (row.id) {
            case "hero":
              return <Hero key="hero" />;
            case "categories":
              return <Categories key="categories" />;
            case "products":
              return <ProductGrid key="products" />;
            case "promo":
              return <PromoBanner key="promo" />;
            case "best":
              return <BestProducts key="best" />;
            default:
              return null;
          }
        })}
      </main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 2: Format and verify**

Run: `npx prettier --write src/pages/Index.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes.

- [ ] **Step 3: Lint**

Run: `npx eslint src/pages/Index.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit (after asking user)**

```bash
git add src/pages/Index.tsx
git commit -m "feat: render homepage sections from settings"
```

---

### Task 8: `ControlsManager` admin component

**Files:**

- Create: `src/components/admin/ControlsManager.tsx`

**Interfaces:**

- Consumes: `turso` from `@/integrations/turso/client`; `useSections` from `@/hooks/useSections`; `useSettings` from `@/hooks/useSettings`; `FIXED_SECTION_LABELS`, `parseSectionsOrder`, `serializeSectionsOrder`, types `GridItem`, `Section`, `SectionEntry` from `@/lib/sections`; `toast` from `sonner`; lucide icons.
- Produces: `ControlsManager()` (no props) — the ordered sections list with toggle/reorder/edit/delete and an Add/Edit modal.

- [ ] **Step 1: Create the component**

Create `src/components/admin/ControlsManager.tsx` (the directory `src/components/admin` does not exist yet — create it):

```tsx
import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSections } from "@/hooks/useSections";
import { useSettings } from "@/hooks/useSettings";
import { turso } from "@/integrations/turso/client";
import type { GridItem, Section, SectionEntry } from "@/lib/sections";
import { FIXED_SECTION_LABELS, parseSectionsOrder, serializeSectionsOrder } from "@/lib/sections";

const inputClass =
  "h-10 w-full rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25";

const emptyGridItem = (): GridItem => ({ image: "", label: "", link: "" });

type EditorState = { mode: "add" } | { mode: "edit"; section: Section } | null;

export function ControlsManager() {
  const { rows, sections, refresh } = useSections();
  const { settings, refresh: refreshSettings } = useSettings();
  const [editor, setEditor] = useState<EditorState>(null);

  async function persistOrder(next: SectionEntry[]) {
    await turso.execute({
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: ["homepage_sections", serializeSectionsOrder(next)],
    });
    await refreshSettings();
  }

  async function toggleVisible(id: string) {
    const next = parseSectionsOrder(settings.homepage_sections, sections).map((e) =>
      e.id === id ? { ...e, visible: !e.visible } : e,
    );
    await persistOrder(next);
  }

  async function move(id: string, dir: -1 | 1) {
    const list = parseSectionsOrder(settings.homepage_sections, sections);
    const idx = list.findIndex((e) => e.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= list.length) return;
    const next = [...list];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    await persistOrder(next);
  }

  async function saveSection(section: Section, mode: "add" | "edit") {
    const isNew = mode === "add";
    try {
      await turso.execute({
        sql: isNew
          ? "INSERT INTO sections (id, type, name, size, image_url, title, subtitle, button_text, button_link, grid_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          : "UPDATE sections SET type=?, name=?, size=?, image_url=?, title=?, subtitle=?, button_text=?, button_link=?, grid_items=? WHERE id=?",
        args: isNew
          ? [
              section.id,
              section.type,
              section.name,
              section.size,
              section.image_url,
              section.title,
              section.subtitle,
              section.button_text,
              section.button_link,
              JSON.stringify(section.grid_items),
            ]
          : [
              section.type,
              section.name,
              section.size,
              section.image_url,
              section.title,
              section.subtitle,
              section.button_text,
              section.button_link,
              JSON.stringify(section.grid_items),
              section.id,
            ],
      });
      if (isNew) {
        const next = parseSectionsOrder(settings.homepage_sections, sections);
        next.push({ id: `sec:${section.id}`, visible: true });
        await persistOrder(next);
      }
      await refresh();
      setEditor(null);
      toast.success(isNew ? "Section added" : "Section updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving section");
    }
  }

  async function deleteSection(id: string) {
    try {
      await turso.execute({
        sql: "DELETE FROM sections WHERE id = ?",
        args: [id.slice(4)],
      });
      const next = parseSectionsOrder(settings.homepage_sections, sections).filter(
        (e) => e.id !== id,
      );
      await persistOrder(next);
      await refresh();
      toast.success("Section deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting section");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Controls
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Arrange the homepage: toggle sections on/off, reorder them, and add custom banners or
            image grids.
          </p>
        </div>
        <button
          onClick={() => setEditor({ mode: "add" })}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add section
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((row, i) => {
          const label = row.isCustom
            ? (row.section?.name ?? "Section")
            : (FIXED_SECTION_LABELS[row.id] ?? row.id);
          return (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3"
            >
              <button
                onClick={() => move(row.id, -1)}
                disabled={i === 0}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </button>
              <button
                onClick={() => move(row.id, 1)}
                disabled={i === rows.length - 1}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                {row.isCustom && row.section && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {row.section.type === "grid"
                      ? "Grid"
                      : `Banner · ${row.section.size[0].toUpperCase()}${row.section.size.slice(1)}`}
                  </p>
                )}
              </div>
              {row.isCustom && row.section && (
                <>
                  <button
                    onClick={() => setEditor({ mode: "edit", section: row.section })}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary"
                    aria-label="Edit section"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteSection(row.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-red-50"
                    aria-label="Delete section"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </>
              )}
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {row.visible ? "On" : "Off"}
                </span>
                <button
                  onClick={() => toggleVisible(row.id)}
                  role="switch"
                  aria-checked={row.visible}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    row.visible ? "bg-accent" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      row.visible ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {editor && (
        <SectionEditorModal
          mode={editor.mode}
          initial={editor.mode === "edit" ? editor.section : undefined}
          onClose={() => setEditor(null)}
          onSave={(section) => saveSection(section, editor.mode)}
        />
      )}
    </section>
  );
}

function SectionEditorModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  initial?: Section;
  onClose: () => void;
  onSave: (section: Section) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<Section["type"]>(initial?.type ?? "banner");
  const [size, setSize] = useState<Section["size"]>(initial?.size ?? "medium");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [buttonText, setButtonText] = useState(initial?.button_text ?? "");
  const [buttonLink, setButtonLink] = useState(initial?.button_link ?? "");
  const [tiles, setTiles] = useState<GridItem[]>(
    initial?.grid_items?.length
      ? initial.grid_items
      : [emptyGridItem(), emptyGridItem(), emptyGridItem()],
  );

  function updateTile(i: number, patch: Partial<GridItem>) {
    setTiles((t) => t.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give the section a name");
      return;
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      type,
      name: name.trim(),
      size,
      image_url: imageUrl.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      button_text: buttonText.trim(),
      button_link: buttonLink.trim(),
      grid_items: tiles.map((t) => ({
        image: t.image.trim(),
        label: t.label.trim(),
        link: t.link.trim(),
      })),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[calc(100dvh-6rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-xl shadow-foreground/10">
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {mode === "add" ? "Add Section" : "Edit Section"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-5 px-6 pt-5 pb-6">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Sale"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Section["type"])}
                  className={inputClass}
                >
                  <option value="banner">Banner</option>
                  <option value="grid">Image grid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as Section["size"])}
                  className={inputClass}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {type === "banner" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Image URL</label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Sale"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Subtitle</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Button text</label>
                  <input
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Shop Now"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Button link</label>
                  <input
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="/shop"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grid tiles (2–8)
              </p>
              {tiles.map((tile, i) => (
                <div key={i} className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Tile {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTiles((t) => t.filter((_, idx) => idx !== i))}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-500"
                      aria-label={`Remove tile ${i + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    placeholder="Image URL"
                    value={tile.image}
                    onChange={(e) => updateTile(i, { image: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Label"
                    value={tile.label}
                    onChange={(e) => updateTile(i, { label: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Link (e.g. /category/dogs)"
                    value={tile.link}
                    onChange={(e) => updateTile(i, { link: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ))}
              {tiles.length < 8 && (
                <button
                  type="button"
                  onClick={() => setTiles((t) => [...t, emptyGridItem()])}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add tile
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" /> {mode === "add" ? "Add Section" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Format and verify**

Run: `npx prettier --write src/components/admin/ControlsManager.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes.

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/admin/ControlsManager.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit (after asking user)**

```bash
git add src/components/admin/ControlsManager.tsx
git commit -m "feat: add homepage controls manager"
```

---

### Task 9: Wire `ControlsManager` into the admin Settings tab

**Files:**

- Modify: `src/pages/Admin.tsx` (import + render in the settings tab)

**Interfaces:**

- Consumes: `ControlsManager` from `@/components/admin/ControlsManager`.
- Produces: the Controls area appears in the Settings tab below the save form.

- [ ] **Step 1: Add the import**

Add this import near the other component imports in `src/pages/Admin.tsx` (after the `TursoSettingsDialog` import, line 9):

```tsx
import { ControlsManager } from "@/components/admin/ControlsManager";
```

- [ ] **Step 2: Render it in the settings tab**

Inside the settings tab JSX, immediately after the closing `</form>` of the settings save form (the `</form>` that closes `saveSettings`, currently around line 1648) and before the "Database connection" section, add:

```tsx
<ControlsManager />
```

- [ ] **Step 3: Format and verify**

Run: `npx prettier --write src/pages/Admin.tsx; if ($?) { & "node_modules/.bin/tsc.exe" --noEmit }`
Expected: tsc passes.

- [ ] **Step 4: Lint**

Run: `npx eslint src/pages/Admin.tsx`
Expected: 0 errors (pre-existing warnings acceptable).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`
Manual checks in the browser (admin login `admin@gmail.com` / `admin123`):

1. Settings → Controls shows Hero, Categories, Product grid, Promo banner, Best products with On/Off toggles.
2. Toggle "Product grid" off → save settings → homepage no longer shows the product grid.
3. Add a section: Banner, Medium, with image URL → appears at the end of the list, toggle on → homepage shows it.
4. Reorder a section (move Promo banner above Categories) → homepage order follows.
5. Edit the banner (change size to Large) → homepage reflects the change.
6. Add an Image grid with 3 tiles → homepage shows the grid.
7. Delete a custom section → it disappears from the list and homepage.
8. Header and footer remain visible throughout.

- [ ] **Step 7: Commit (after asking user)**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: wire controls manager into admin settings"
```

---

## Self-Review

- **Spec coverage:** Data model (settings key + sections table) → Tasks 2, 3. Custom sections CRUD → Tasks 2, 8. Ordered list with visibility → Tasks 1, 3, 7, 8. Banner sizes + grid tiles → Tasks 5, 6, 8. Admin Controls in Settings → Task 9. Removal of ExtraBanner/banner\_\* → Task 3. Error handling (parse fallbacks, try/catch on DB writes) → Tasks 1, 4, 8.
- **Placeholder scan:** Every task has concrete code; no TODOs/TBDs.
- **Type consistency:** `Section`, `SectionEntry`, `SectionRow`, `parseSectionsOrder`, `serializeSectionsOrder`, `sectionFromRow`, `mapSectionsToRows`, `useSections().rows/sections/refresh` are defined in Tasks 1/4 and referenced identically in Tasks 7/8.
