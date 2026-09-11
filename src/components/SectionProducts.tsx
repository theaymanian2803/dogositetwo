import { useEffect, useState } from "react";
import { turso } from "@/integrations/turso/client";
import type { Section } from "@/lib/sections";
import { ProductCard, type ProductCardProduct } from "@/components/ProductCard";

export function SectionProducts({ section }: { section: Section }) {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const ids = section.product_ids;

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    const placeholders = ids.map(() => "?").join(",");
    turso
      .execute({
        sql: `SELECT id, name, slug, price, image_url, badge, tag FROM products WHERE id IN (${placeholders})`,
        args: ids,
      })
      .then(({ rows }) => {
        const byId = new Map((rows as unknown as ProductCardProduct[]).map((p) => [p.id, p]));
        setProducts(ids.map((id) => byId.get(id)).filter((p): p is ProductCardProduct => !!p));
      })
      .catch(() => setProducts([]));
  }, [ids]);

  if (products.length === 0) return null;
  const cols = section.columns === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3";
  const heading = section.title || section.name;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      {heading && (
        <div className="text-center">
          <h3 className="font-display text-3xl font-bold md:text-4xl">{heading}</h3>
        </div>
      )}
      {section.subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted-foreground md:text-base">
          {section.subtitle}
        </p>
      )}
      <div className={`mt-12 grid gap-6 ${cols}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
