import { jwtVerify, importJWK } from "jose";

export type GrantMode = "forever" | "managed";

export type GrantPayload = {
  key: string;
  product: string;
  domain: string;
  mode: GrantMode;
  iat: number;
  exp?: number;
};

export type VerifyReason = "domain" | "expired" | "bad_signature";

/** Lowercases, strips scheme/path/port/trailing dot so bindings compare exactly. */
export function normalizeHost(input: string): string {
  let s = String(input ?? "")
    .trim()
    .toLowerCase();
  try {
    if (s.includes("://")) s = new URL(s).host;
  } catch {
    /* treat as a bare host */
  }
  return s.split("/")[0].replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * Verifies a grant's signature and that it is bound to `host` and unexpired.
 * Pure and local — no network. Mirrors dogcatpro/server/src/license.ts.
 */
export async function verifyGrant(
  token: string,
  host: string,
  publicJwk: string,
): Promise<{ ok: true; payload: GrantPayload } | { ok: false; reason: VerifyReason }> {
  try {
    const key = await importJWK(JSON.parse(publicJwk), "EdDSA");
    const { payload } = await jwtVerify(token, key, { algorithms: ["EdDSA"] });
    const p = payload as unknown as GrantPayload;
    if (normalizeHost(p.domain) !== normalizeHost(host)) return { ok: false, reason: "domain" };
    if (p.exp && p.exp * 1000 < Date.now()) return { ok: false, reason: "expired" };
    return { ok: true, payload: p };
  } catch (e) {
    if ((e as { code?: string })?.code === "ERR_JWT_EXPIRED")
      return { ok: false, reason: "expired" };
    return { ok: false, reason: "bad_signature" };
  }
}
