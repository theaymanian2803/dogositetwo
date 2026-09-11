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
