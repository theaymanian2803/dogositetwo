import { Link } from "react-router-dom";
import type { Section } from "@/lib/sections";

export function SectionBanner({ section }: { section: Section }) {
  if (!section.image_url) return null;
  const sizeClass = {
    small: "py-10 md:py-14",
    medium: "py-16 md:py-24",
    large: "min-h-[70vh] py-24 md:py-32",
  }[section.size];
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[section.align];
  return (
    <section className={`relative overflow-hidden bg-promo ${sizeClass}`}>
      <img
        src={section.image_url}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-foreground/35" />
      <div className={`relative mx-auto flex max-w-7xl items-center px-6 ${alignClass}`}>
        <div className="max-w-xl rounded-2xl bg-card/95 p-6 shadow-2xl shadow-black/10 backdrop-blur-md md:p-10">
          {section.title && (
            <h3 className="font-display text-3xl font-bold md:text-4xl">{section.title}</h3>
          )}
          {section.subtitle && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {section.subtitle}
            </p>
          )}
          <Link to={section.button_link.trim() || "/shop"} className="btn-dark mt-6 inline-flex">
            {section.button_text.trim() || "Shop Now"}
          </Link>
        </div>
      </div>
    </section>
  );
}
