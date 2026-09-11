import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { turso } from "@/integrations/turso/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  badge: string | null;
  tag: string | null;
};

export default function Category() {
  const { t } = useI18n();
  const { category = "" } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const title = category ? category[0].toUpperCase() + category.slice(1) : "Category";
    document.title = `${title} — PetPals`;
  }, [category]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    turso
      .execute({
        sql: "SELECT id, name, slug, price, image_url, badge, tag FROM products WHERE category = ? ORDER BY created_at DESC",
        args: [category],
      })
      .then(({ rows }) => {
        setProducts(rows as unknown as Product[]);
        setLoading(false);
      });
  }, [category]);

  const title = category ? category[0].toUpperCase() + category.slice(1) : "";
  const subtitle =
    category === "dogs"
      ? "Everything your best friend needs — food, beds, toys and more."
      : category === "cats"
        ? "Curated essentials for your feline — from cozy beds to playful toys."
        : `Browse our ${category} collection.`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground capitalize">{category}</span>
        </nav>

        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{subtitle}</p>
        </header>

        {loading ? (
          <p className="py-20 text-center text-muted-foreground">Loading…</p>
        ) : products.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">{t("category.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
