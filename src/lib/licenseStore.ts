import { turso } from "@/integrations/turso/client";
import { normalizeHost } from "@/lib/licenseVerify";

/** Domain-scoped so buyers sharing the demo DB never clobber each other. */
const rowKey = (host: string) => `license_grant:${normalizeHost(host)}`;

/** Idempotent — a brand-new buyer DB may not have `settings` yet. */
export async function ensureLicenseTable(): Promise<void> {
  await turso.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)");
}

export async function readGrant(host: string): Promise<string | null> {
  await ensureLicenseTable();
  const rs = await turso.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [rowKey(host)],
  });
  if (rs.rows.length === 0) return null;
  const value = String(rs.rows[0].value ?? "");
  return value || null;
}

export async function writeGrant(host: string, token: string): Promise<void> {
  await ensureLicenseTable();
  await turso.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [rowKey(host), token],
  });
}

export async function clearGrant(host: string): Promise<void> {
  await ensureLicenseTable();
  await turso.execute({ sql: "DELETE FROM settings WHERE key = ?", args: [rowKey(host)] });
}
