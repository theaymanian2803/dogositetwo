import { Link } from "react-router-dom";
import type { Section } from "@/lib/sections";

export function SectionGrid({ section }: { section: Section }) {
  const items = section.grid_items.filter((g) => g.image);
  if (items.length === 0) return null;
  const cols =
    items.length <= 2
      ? "sm:grid-cols-2"
      : items.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 md:grid-cols-4";
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      {(section.title || section.name) && (
        <div className="text-center">
          <h3 className="font-display text-3xl font-bold md:text-4xl">
            {section.title || section.name}
          </h3>
        </div>
      )}
      {section.subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted-foreground md:text-base">
          {section.subtitle}
        </p>
      )}
      <div className={`mt-12 grid grid-cols-1 gap-4 ${cols}`}>
        {items.map((g, i) => (
          <Link
            key={i}
            to={g.link || "/shop"}
            className="group relative block overflow-hidden rounded-2xl card-lift"
          >
            <img
              src={g.image}
              alt={g.label || ""}
              loading="lazy"
              className="aspect-square w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            {g.label && (
              <span className="absolute inset-x-0 bottom-0 bg-foreground/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                {g.label}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
