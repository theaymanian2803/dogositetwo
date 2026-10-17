import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLicense } from "@/hooks/useLicense";

const friendly = (raw: string | null | undefined, brand: string): string => {
  switch ((raw ?? "").trim()) {
    case "invalid":
      return "That key isn't valid. Check for typos or contact support.";
    case "product":
      return `That key is for a different product. Use your ${brand} key.`;
    case "domain_limit":
      return "This key has reached its domain limit. Contact support to add another site.";
    case "expired":
      return "This key has expired. Contact support to renew it.";
    case "revoked":
      return "This key was revoked. Contact support.";
    case "unreachable":
      return "Could not reach the license server. Check your connection and try again.";
    default:
      return raw || "Activation failed. Please try again.";
  }
};

/**
 * The product-key field + Activate action, shared by the standalone Activate
 * screen and the onboarding tour's final step. On success the grant is stored
 * by `useLicense().activate`; `onActivated` (default: reload) decides what the
 * caller does next.
 */
export const LicenseKeyForm = ({
  brand = "this template",
  onActivated,
}: {
  brand?: string;
  onActivated?: () => void;
}) => {
  const { activate, isActivating, activateError, resetActivate } = useLicense();
  const [key, setKey] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetActivate();
    try {
      await activate(key.trim());
      if (onActivated) onActivated();
      else window.location.reload();
    } catch {
      // surfaced through activateError
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="license-key">Key</Label>
        <Input
          id="license-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="DOGOSITE-XXXX-XXXX-XXXX"
          autoComplete="off"
          className="font-mono"
          required
        />
      </div>
      {activateError && (
        <p className="text-sm text-destructive">{friendly(activateError.message, brand)}</p>
      )}
      <Button type="submit" className="w-full" disabled={isActivating || !key.trim()}>
        {isActivating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Activate
      </Button>
    </form>
  );
};
