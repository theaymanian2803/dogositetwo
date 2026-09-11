import { createClient } from "@libsql/client/web";
import { getTursoConfig } from "@/lib/tursoConfig";

type TursoClient = ReturnType<typeof createClient>;

let cachedClient: TursoClient | null = null;

export function getTursoClient(): TursoClient {
  if (!cachedClient) {
    const cfg = getTursoConfig();
    cachedClient = createClient({ url: cfg.url, authToken: cfg.token });
  }
  return cachedClient;
}

export function resetTursoClient(): void {
  cachedClient = null;
}

export async function testTursoConnection(
  url: string,
  token: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const probe = createClient({ url: url.trim(), authToken: token.trim() });
    await probe.execute("SELECT 1");
    return { ok: true, message: "Connected" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Connection failed",
    };
  }
}

export const turso = new Proxy({} as TursoClient, {
  get(_target, prop: string | symbol) {
    const client = getTursoClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
