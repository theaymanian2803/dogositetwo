import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import biscuit from "@/assets/product-biscuit.jpg";
import bed from "@/assets/product-bed.jpg";
import food from "@/assets/product-food.jpg";
import groom from "@/assets/product-groom.jpg";

const items = [
  {
    name: "Chicken Flavoured Biscuit",
    price: "80.00 MAD",
    img: biscuit,
    badge: "-46%",
    to: "/category/foods",
  },
  { name: "Ultra Soft Puppy Bed", price: "155.00 MAD", img: bed, to: "/category/bed" },
  { name: "Sea Fish Dry Cat Food", price: "120.00 MAD", img: food, to: "/category/foods" },
  {
    name: "Soft Pined Pet's Grooming Brush",
    price: "120.00 MAD",
    img: groom,
    to: "/category/groom",
  },
];

export function BestProducts() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="font-display text-4xl font-bold md:text-5xl">{t("best.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">{t("best.subtitle")}</p>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((p) => (
          <Link
            key={p.name}
            to={p.to}
            className="group rounded-2xl bg-card shadow-sm p-3 card-lift"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/70">
              {p.badge && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-accent-foreground">
                  {p.badge}
                </span>
              )}
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                width={800}
                height={800}
                className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="px-2 pb-1 pt-4 text-center">
              <h3 className="font-display text-[15px] font-semibold leading-snug">{p.name}</h3>
              <p className="mt-1.5 text-sm font-bold text-accent">{p.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
