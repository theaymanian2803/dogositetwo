import { Link } from "react-router-dom";
import promo from "@/assets/promo-pets.jpg";
import food from "@/assets/product-food.jpg";
import { Star } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useI18n } from "@/lib/i18n";

export function PromoBanner() {
  const { settings } = useSettings();
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      <img
        src={promo}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/40 to-foreground/10" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-end px-6 py-16 md:py-24">
        <div className="grid w-full max-w-2xl items-center gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-black/5">
            <img
              src={food}
              alt="Chicken flavor food"
              loading="lazy"
              width={800}
              height={800}
              className="aspect-square w-full object-contain"
            />
          </div>
          <div className="rounded-2xl bg-card p-7 shadow-lg shadow-black/10 md:p-9">
            <h3 className="font-display text-3xl font-bold md:text-4xl">{settings.promo_title}</h3>
            <div className="mt-3 flex gap-0.5 text-accent">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-4">
              <span className="text-sm text-muted-foreground line-through">
                {settings.promo_old_price}
              </span>
              <span className="ml-2 font-display text-3xl font-bold text-accent">
                {settings.promo_price} Only
              </span>
            </p>
            <Link to="/category/foods" className="btn-dark mt-7 inline-flex">
              {t("promo.shop")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
