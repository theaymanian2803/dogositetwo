import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLicenseConfig } from "@/lib/licenseConfig";
import { normalizeHost, verifyGrant } from "@/lib/licenseVerify";
import { clearGrant, readGrant, writeGrant } from "@/lib/licenseStore";

export type LicenseStatus = {
  licensed: boolean;
  domain?: string;
  mode?: string;
  reason?: string;
};

const host = () => normalizeHost(window.location.host);

/** Local check + optional heartbeat for managed grants. Throws only if Turso is unreachable. */
async function fetchStatus(): Promise<LicenseStatus> {
  const cfg = getLicenseConfig();
  const h = host();
  if (cfg.disabled) return { licensed: true, domain: h, mode: "disabled" };

  const token = await readGrant(h);
  if (!token) return { licensed: false, domain: h, reason: "missing" };

  const v = await verifyGrant(token, h, cfg.publicKey);
  if (!v.ok) return { licensed: false, domain: h, reason: v.reason };

  if (v.payload.mode === "managed") {
    try {
      const res = await fetch(`${cfg.serverUrl}/v1/heartbeat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: v.payload.key, domain: h }),
      });
      const data = (await res.json().catch(() => ({}))) as { grant?: string };
      if (res.ok && data.grant) await writeGrant(h, data.grant);
      else if (!res.ok) await clearGrant(h);
    } catch {
      // License server unreachable: keep the cached grant (grace window).
    }
  }
  return { licensed: true, domain: h, mode: v.payload.mode };
}

export const useLicense = (options: { enabled?: boolean } = {}) => {
  const qc = useQueryClient();

  const status = useQuery<LicenseStatus>({
    queryKey: ["license"],
    queryFn: fetchStatus,
    retry: false,
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });

  const mutation = useMutation({
    mutationFn: async (key: string) => {
      const cfg = getLicenseConfig();
      const h = host();
      let res: Response;
      try {
        res = await fetch(`${cfg.serverUrl}/v1/activate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key: key.trim(), domain: h, product: cfg.product }),
        });
      } catch {
        throw new Error("unreachable");
      }
      const data = (await res.json().catch(() => ({}))) as {
        grant?: string;
        mode?: string;
        error?: string;
      };
      if (!res.ok || !data.grant) throw new Error(data.error ?? "invalid");
      await writeGrant(h, data.grant);
      return { licensed: true, mode: data.mode };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["license"] }),
  });

  return {
    status: status.data,
    isLoading: status.isLoading,
    isError: status.isError,
    refetch: status.refetch,
    activate: mutation.mutateAsync,
    isActivating: mutation.isPending,
    activateError: mutation.error as Error | null,
    resetActivate: mutation.reset,
  };
};
