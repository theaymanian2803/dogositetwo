export interface LicenseConfig {
  serverUrl: string;
  publicKey: string; // Ed25519 public JWK (JSON string) — baked on purpose
  product: string;
  disabled: boolean;
}

/**
 * Baked defaults so a fresh deployment works with zero configuration. The public
 * key is deliberately NOT env-overridable: an overridable key would let anyone
 * self-sign a grant for any domain and bypass verification (equal in weight to
 * VITE_LICENSE_DISABLED). Server URL and product stay overridable — an alternate
 * server cannot sign with the real private key, so they cannot bypass anything.
 */
const FALLBACK = {
  serverUrl: "https://petpaw-license.sberechou.workers.dev",
  publicKey: '{"crv":"Ed25519","kty":"OKP","x":"q2tMoDat1ek3FhSY-mBJp9FTwRQbwNSS-n8fC32REiI"}',
  product: "dogositetwo",
} as const;

export function getLicenseConfig(): LicenseConfig {
  const env = import.meta.env;
  return {
    serverUrl: (env.VITE_LICENSE_SERVER_URL ?? FALLBACK.serverUrl).replace(/\/$/, ""),
    publicKey: FALLBACK.publicKey,
    product: env.VITE_LICENSE_PRODUCT ?? FALLBACK.product,
    disabled: env.VITE_LICENSE_DISABLED === "1",
  };
}
