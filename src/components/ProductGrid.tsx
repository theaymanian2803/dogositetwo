import { useEffect, useState } from "react";
import { turso } from "@/integrations/turso/client";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type ProductCardProduct } from "@/components/ProductCard";

export function ProductGrid() {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    turso
      .execute(
        "SELECT id, name, slug, price, image_url, badge, tag FROM products ORDER BY created_at DESC LIMIT 8",
      )
      .then(({ rows }) => setProducts(rows as unknown as ProductCardProduct[]));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="font-display text-4xl font-bold md:text-5xl">{t("products.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          {t("products.subtitle")}
        </p>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
