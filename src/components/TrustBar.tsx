import { Clock, PackageCheck, Truck, Wallet } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useI18n } from "@/lib/i18n";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

export function TrustBar() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const threshold = Number(settings.free_shipping_threshold) || FREE_SHIPPING_THRESHOLD;
  const items = [
    { icon: Truck, text: t("trust.free", { threshold }) },
    { icon: Wallet, text: t("trust.cod") },
    { icon: PackageCheck, text: settings.delivery_note },
    { icon: Clock, text: t("trust.open", { hours: settings.support_hours }) },
  ];
  return (
    <div className="border-b border-border bg-secondary/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-6 py-2 text-xs text-muted-foreground">
        {items.map((it) => (
          <span key={it.text} className="flex items-center gap-1.5">
            <it.icon className="h-3.5 w-3.5 text-accent" />
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}
