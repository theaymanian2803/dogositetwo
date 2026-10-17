import { KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LicenseKeyForm } from "@/components/admin/LicenseKeyForm";

export const ActivateScreen = ({ brand = "this template" }: { brand?: string }) => (
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-accent" /> Product key
          </CardTitle>
          <CardDescription>Paste the key from your purchase receipt.</CardDescription>
        </CardHeader>
        <CardContent>
          <LicenseKeyForm brand={brand} />
        </CardContent>
      </Card>
    </div>
  </div>
);
