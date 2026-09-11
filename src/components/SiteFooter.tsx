import { Link } from "react-router-dom";
import { Facebook, Instagram, Music2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const cols: { title: string; links: { key: string; to: string }[] }[] = [
    {
      title: "footer.shop",
      links: [
        { key: "footer.dogs", to: "/category/dogs" },
        { key: "footer.cats", to: "/category/cats" },
        { key: "footer.brands", to: "/shop" },
        { key: "footer.newArrivals", to: "/shop" },
      ],
    },
    {
      title: "footer.help",
      links: [
        { key: "footer.track", to: "/track" },
        { key: "footer.contact", to: "/contact" },
        { key: "footer.shipping", to: "/shipping" },
        { key: "footer.returns", to: "/returns" },
        { key: "footer.faq", to: "/faq" },
      ],
    },
    {
      title: "footer.company",
      links: [
        { key: "footer.about", to: "/about" },
        { key: "footer.careers", to: "/careers" },
        { key: "footer.press", to: "/press" },
        { key: "footer.sustainability", to: "/sustainability" },
      ],
    },
  ];
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4 md:py-20">
        <div>
          <div className="flex items-center gap-3">
            {settings.brand_logo ? (
              <img
                src={settings.brand_logo}
                alt={settings.brand_name}
                className="h-11 w-11 rounded-2xl bg-primary-foreground/10 object-contain p-1"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-foreground/10 text-2xl">
                🐾
              </span>
            )}
            <span className="font-display text-2xl font-bold">{settings.brand_name}</span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {settings.tagline}
          </p>
          {(settings.instagram_url || settings.facebook_url || settings.tiktok_url) && (
            <div className="mt-6 flex items-center gap-2">
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground/80 transition-colors hover:bg-primary hover:text-accent-foreground"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground/80 transition-colors hover:bg-primary hover:text-accent-foreground"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.tiktok_url && (
                <a
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground/80 transition-colors hover:bg-primary hover:text-accent-foreground"
                >
                  <Music2 className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
              {t(c.title)}
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              {c.links.map((l) => (
                <li key={l.key}>
                  <Link to={l.to} className="transition-colors hover:text-accent">
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-primary-foreground/15 py-6 text-center text-xs text-primary-foreground/60">
        {t("footer.rights", { year: new Date().getFullYear(), brand: settings.brand_name })}
      </div>
    </footer>
  );
}
