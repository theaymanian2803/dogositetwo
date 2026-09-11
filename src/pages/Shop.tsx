import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { turso } from "@/integrations/turso/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { SlidersHorizontal, X, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string;
  badge: string | null;
  tag: string | null;
  created_at: string;
};

type Category = { id: string; name: string; slug: string };

const PAGE_SIZE = 15;

export default function Shop() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "name-asc">(
    "newest",
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = "Shop — PetPals";
  }, []);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      turso.execute("SELECT * FROM products ORDER BY created_at DESC"),
      turso.execute("SELECT * FROM categories ORDER BY name"),
    ]).then(([pRs, cRs]) => {
      setProducts(pRs.rows as unknown as Product[]);
      setCategories(cRs.rows as unknown as Category[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tag ?? "").toLowerCase().includes(q),
      );
    }

    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category));
    }

    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return list;
  }, [products, query, selectedCategories, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategories, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function clearFilters() {
    setQuery("");
    setSelectedCategories([]);
    setSortBy("newest");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      return next;
    });
  }

  function clearSearch() {
    setQuery("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      return next;
    });
  }

  const activeFilterCount =
    selectedCategories.length + (query ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            {t("nav.home")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{t("nav.shop")}</span>
        </nav>

        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">{t("nav.shop")}</h1>
          <p className="mt-3 text-muted-foreground">{t("shop.subtitle")}</p>
        </header>

        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => setMobileFiltersOpen((s) => !s)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("shop.filters")}
            {activeFilterCount > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-muted-foreground hidden sm:inline">
              {t("shop.sortBy")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-accent"
            >
              <option value="newest">{t("shop.sortNewest")}</option>
              <option value="price-asc">{t("shop.sortPriceAsc")}</option>
              <option value="price-desc">{t("shop.sortPriceDesc")}</option>
              <option value="name-asc">{t("shop.sortNameAsc")}</option>
            </select>
          </div>
        </div>

        {query.trim() && (
          <div className="mb-8 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
            <span className="text-muted-foreground">{t("shop.resultsFor")}</span>
            <span className="font-semibold">“{query.trim()}”</span>
            <button
              onClick={clearSearch}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary/70"
            >
              <X className="h-3 w-3" /> {t("shop.clearSearch")}
            </button>
          </div>
        )}

        <div className="flex gap-10">
          <aside
            className={`w-64 shrink-0 space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:self-start lg:overflow-y-auto ${mobileFiltersOpen ? "block" : "hidden lg:block"}`}
          >
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <X className="h-3.5 w-3.5" /> {t("shop.clearFilters")}
              </button>
            )}

            <div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mb-3 flex w-full items-center justify-between text-left lg:cursor-default"
              >
                <h3 className="font-bold">{t("nav.categories")}</h3>
                <ChevronUp className="h-4 w-4 lg:hidden" />
              </button>
              <div className="space-y-2">
                {categories.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(c.slug)}
                      onChange={() => toggleCategory(c.slug)}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {products.filter((p) => p.category === c.slug).length}
                    </span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("shop.noCategories")}</p>
                )}
              </div>
            </div>
          </aside>

          <section className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-2xl bg-muted" />
                    <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-lg font-semibold">{t("shop.noProducts")}</p>
                <p className="mt-1 text-muted-foreground">
                  Try adjusting your filters or search query.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t("shop.clearFilters")}
                </button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                  {paginated.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t("shop.prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`grid h-10 w-10 place-items-center rounded-full text-sm font-medium ${
                          page === i + 1
                            ? "bg-primary text-white"
                            : "border border-border bg-card hover:bg-secondary"
                        }`}
                        aria-label={`Page ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t("shop.next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
