import { useState } from "react";
import { Database, RotateCcw, X } from "lucide-react";
import { dismissSetupBanner, shouldShowSetupBanner } from "@/lib/tursoConfig";
import { restartOnboarding } from "@/lib/onboarding";
import { useOpenSettingsDialog } from "@/lib/settingsDialog";

export function DemoBanner() {
  const [visible, setVisible] = useState(shouldShowSetupBanner());
  const openSettings = useOpenSettingsDialog();

  if (!visible) return null;

  return (
    <div className="border-b border-border bg-accent/5 px-4 sm:px-6 lg:px-20 py-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="flex-1">
          This store is running on a shared demo database. Connect your own database to keep your
          data private.
        </span>
        <button
          data-tour="connect-button"
          onClick={openSettings}
          className="shrink-0 inline-flex h-8 items-center rounded-full bg-primary px-4 text-xs font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Connect
        </button>
        <button
          onClick={restartOnboarding}
          className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
        >
          <RotateCcw className="h-3 w-3" /> Restart tour
        </button>
        <button
          onClick={() => {
            dismissSetupBanner();
            setVisible(false);
          }}
          aria-label="Dismiss"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
