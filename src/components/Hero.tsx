import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroPets from "@/assets/hero-pets.jpg";
import { useSettings } from "@/hooks/useSettings";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { settings } = useSettings();
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      <img
        src={settings.hero_image || heroPets}
        alt={settings.hero_image ? settings.brand_name : "Puppy and kitten with bowl of food"}
        width={1024}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/50 to-foreground/15" />
      <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-6 py-16 md:min-h-[640px] md:py-24">
        <div className="max-w-2xl">
          <h1
            data-tour="home-hero"
            className="font-display text-5xl font-bold leading-[1.04] text-white md:text-7xl"
          >
            {settings.hero_title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <div className="squiggle mt-6" />
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">
            {settings.hero_subtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/shop" data-tour="home-shop" className="btn-accent gap-2">
              {t("hero.shop")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {t("nav.categories")}
            </Link>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
            {settings.hero_badge}
          </span>
        </div>
      </div>
    </section>
  );
}
