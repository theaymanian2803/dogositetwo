import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export const ActivateScreen = ({ brand = "this template" }: { brand?: string }) => {
  const { activate, isActivating, activateError, resetActivate } = useLicense();
  const [key, setKey] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetActivate();
    try {
      await activate(key.trim());
      window.location.reload();
    } catch {
      // surfaced through activateError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-secondary/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-foreground">
            <KeyRound className="h-7 w-7 text-accent" /> Activate {brand}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your product key to unlock the admin dashboard.
          </p>
        </div>

        <Card className="rounded-2xl">
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-5 w-5 text-accent" /> Product key
              </CardTitle>
              <CardDescription>Paste the key from your purchase receipt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isActivating || !key.trim()}>
                {isActivating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Activate
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
