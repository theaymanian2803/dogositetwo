export type SectionSize = "small" | "medium" | "large";
export type SectionType = "banner" | "grid" | "products";
export type SectionColumns = 2 | 3;
export type SectionAlign = "left" | "center" | "right";

export type GridItem = { image: string; label: string; link: string };

export type Section = {
  id: string;
  type: SectionType;
  name: string;
  size: SectionSize;
  align: SectionAlign;
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  grid_items: GridItem[];
  columns: SectionColumns;
  product_ids: string[];
};

export type SectionEntry = { id: string; visible: boolean };

export type SectionRow = {
  id: string;
  visible: boolean;
  isCustom: boolean;
  section: Section | null;
};

export const FIXED_SECTION_IDS = [
  "hero",
  "categories",
  "products",
  "promo",
  "best",
  "reviews",
] as const;

export const FIXED_SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  categories: "Categories",
  products: "Product grid",
  promo: "Promo banner",
  best: "Best products",
  reviews: "Customer reviews",
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

export function parseProductIds(raw: string | null): string[] {
  try {
    const arr = JSON.parse(raw ?? "[]");
    if (!Array.isArray(arr)) return [];
    return arr.map((x: unknown) => String(x)).filter((x) => x.length > 0);
  } catch {
    return [];
  }
}

export function parseColumns(raw: unknown): SectionColumns {
  return raw === 2 ? 2 : 3;
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
  for (const id of FIXED_SECTION_IDS) {
    if (!existing.has(id)) base.push({ id, visible: true });
  }
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
    type: row.type === "grid" ? "grid" : row.type === "products" ? "products" : "banner",
    name: String(row.name ?? ""),
    size: row.size === "small" || row.size === "large" ? row.size : "medium",
    align: row.align === "left" || row.align === "right" ? row.align : "center",
    image_url: String(row.image_url ?? ""),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    button_text: String(row.button_text ?? ""),
    button_link: String(row.button_link ?? ""),
    grid_items: parseGridItems(String(row.grid_items ?? "[]")),
    columns: parseColumns(row.columns),
    product_ids: parseProductIds(String(row.product_ids ?? "[]")),
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
