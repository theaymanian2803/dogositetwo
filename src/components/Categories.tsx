import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import groom from "@/assets/product-groom.jpg";
import collar from "@/assets/product-collar.jpg";
import bed from "@/assets/product-bed.jpg";
import bone from "@/assets/product-bone.jpg";
import food from "@/assets/product-food.jpg";

const items = [
  { name: "Groom", img: groom, to: "/category/groom" },
  { name: "Collar", img: collar, to: "/category/collar" },
  { name: "Bed", img: bed, to: "/category/bed" },
  { name: "Retractable Leash", img: bone, to: "/category/dogs" },
  { name: "Foods", img: food, to: "/category/foods" },
];

export function Categories() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="font-display text-4xl font-bold md:text-5xl">{t("categories.title")}</h2>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <Link key={it.name} to={it.to} className="group flex flex-col items-center text-center">
            <div className="rounded-2xl aspect-square w-full overflow-hidden bg-secondary/70 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md">
              <img
                src={it.img}
                alt={it.name}
                loading="lazy"
                width={800}
                height={800}
                className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <span className="mt-5 font-display text-[15px] font-semibold">{it.name}</span>
            <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-accent opacity-0 transition-opacity group-hover:opacity-100">
              {t("hero.shop")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
