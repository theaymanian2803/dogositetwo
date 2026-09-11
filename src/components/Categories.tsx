import bed from "@/assets/product-bed.jpg";
import bone from "@/assets/product-bone.jpg";
import collar from "@/assets/product-collar.jpg";
import food from "@/assets/product-food.jpg";
import groom from "@/assets/product-groom.jpg";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const items = [
  { name: "Groom", img: groom, to: "/category/groom", tone: "bg-primary", tile: "" },
  {
    name: "Collar",
    img: collar,
    to: "/category/collar",
    tone: "bg-accent",
    tile: "lg:aspect-[8/5] lg:mt-8",
  },
  { name: "Bed", img: bed, to: "/category/bed", tone: "bg-primary", tile: "lg:mt-2" },
  {
    name: "Retractable Leash",
    img: bone,
    to: "/category/dogs",
    tone: "bg-accent",
    tile: "lg:aspect-[8/5] lg:mt-12",
  },
  { name: "Foods", img: food, to: "/category/foods", tone: "bg-primary", tile: "lg:mt-4" },
];

export function Categories() {
  const { t } = useI18n();

  return (
    <section className="px-6 py-20 mx-auto max-w-7xl">
      <div className="text-center">
        <h2 className="text-4xl font-bold font-display md:text-5xl">{t("categories.title")}</h2>
        <div className="squiggle mx-auto mt-5" />
      </div>

      {/* Masonry: equal-width green tiles, staggered heights and offsets, uniform product scale */}
      <div className="grid grid-cols-2 items-start gap-5 mt-14 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <Link
            key={it.name}
            to={it.to}
            className={`group flex aspect-[3/2] flex-col rounded-[2rem] p-4 text-center card-lift md:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${it.tone} ${it.tile}`}
          >
            {/* Title - always visible */}
            <h3 className="min-h-[3rem] text-base font-bold tracking-tight uppercase font-display text-primary-foreground sm:text-lg">
              {it.name}
            </h3>

            {/* Image - white well, identical scale in every tile, never clipped */}
            <div className="flex flex-1 items-center justify-center py-3">
              <img
                src={it.img}
                alt={it.name}
                loading="lazy"
                width={800}
                height={800}
                className="h-full w-full rounded-[1.25rem] bg-white object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Shop pill - inverted on green, revealed on hover (desktop), always visible on touch */}
            <div className="flex justify-center opacity-100 transition-all duration-300 lg:-translate-y-1.5 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm transition-all hover:opacity-90 active:scale-95">
                {t("hero.shop")} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}