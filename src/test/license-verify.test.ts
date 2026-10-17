import { describe, it, expect, beforeAll } from "vitest";
import { webcrypto } from "node:crypto";
import { SignJWT, generateKeyPair, exportJWK } from "jose";
import { normalizeHost, verifyGrant } from "@/lib/licenseVerify";

// jose needs WebCrypto. Node 20+ exposes it globally; guard for Node 18.
if (!(globalThis as { crypto?: unknown }).crypto) {
  (globalThis as { crypto?: unknown }).crypto = webcrypto;
}

let publicJwk = "";
let privateKey: CryptoKey;

beforeAll(async () => {
  const kp = await generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });
  privateKey = kp.privateKey as CryptoKey;
  publicJwk = JSON.stringify(await exportJWK(kp.publicKey));
});

async function sign(claims: Record<string, unknown>, exp?: number) {
  const jwt = new SignJWT(claims).setProtectedHeader({ alg: "EdDSA" }).setIssuedAt();
  if (exp) jwt.setExpirationTime(exp);
  return jwt.sign(privateKey);
}

const base = {
  key: "DOSITEON-A1B2-C3D4-E5F6",
  product: "dogositeone",
  domain: "shop.example.com",
  mode: "forever" as const,
};

describe("normalizeHost", () => {
  it("lowercases and strips scheme, port, path and trailing dot", () => {
    expect(normalizeHost("HTTPS://Shop.Example.com:8443/path")).toBe("shop.example.com");
    expect(normalizeHost("shop.example.com.")).toBe("shop.example.com");
    expect(normalizeHost("  Shop.Example.com  ")).toBe("shop.example.com");
    expect(normalizeHost("shop.example.com")).toBe("shop.example.com");
  });
});

describe("verifyGrant", () => {
  it("accepts a valid grant bound to the host", async () => {
    const token = await sign(base);
    const r = await verifyGrant(token, "shop.example.com", publicJwk);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.key).toBe(base.key);
  });

  it("rejects a forged/garbage token", async () => {
    expect(await verifyGrant("not.a.jwt", "shop.example.com", publicJwk)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("rejects a grant bound to another domain", async () => {
    const token = await sign({ ...base, domain: "other.example.com" });
    expect(await verifyGrant(token, "shop.example.com", publicJwk)).toEqual({
      ok: false,
      reason: "domain",
    });
  });

  it("rejects an expired managed grant", async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const token = await sign({ ...base, mode: "managed" }, past);
    const r = await verifyGrant(token, "shop.example.com", publicJwk);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("expired");
  });

  it("accepts a forever grant with no exp", async () => {
    const token = await sign({ ...base, mode: "forever" });
    expect((await verifyGrant(token, "shop.example.com", publicJwk)).ok).toBe(true);
  });
});
