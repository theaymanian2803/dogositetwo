import { useEffect, useState, useRef } from "react";
import {
  Search,
  ShoppingBag,
  Lock,
  User,
  ChevronDown,
  Menu,
  PawPrint,
  Dog,
  Cat,
  Apple,
  Scissors,
  Shirt,
  Bed,
  Puzzle,
  Languages,
  Check,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useSettings } from "@/hooks/useSettings";
import { useI18n, LANGS } from "@/lib/i18n";
import { turso } from "@/integrations/turso/client";
import { DemoBanner } from "@/components/DemoBanner";
import { TrustBar } from "@/components/TrustBar";
import { formatPrice } from "@/lib/currency";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProductSearchResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string;
};

const staticNav = [
  { key: "nav.home", to: "/" },
  { key: "nav.shop", to: "/shop" },
];

const categoryIcons: Record<string, typeof Dog> = {
  dogs: Dog,
  cats: Cat,
  foods: Apple,
  groom: Scissors,
  collar: Shirt,
  bed: Bed,
  toys: Puzzle,
};

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useUserAuth();
  const { settings } = useSettings();
  const { t, lang, setLang } = useI18n();
  const active = LANGS.find((l) => l.code === lang);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSearch = useRef("");
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const sheetSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    turso.execute("SELECT * FROM categories ORDER BY name").then(({ rows }) => {
      setCategories(rows as unknown as { id: string; name: string; slug: string }[]);
    });
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        megaRef.current &&
        !megaRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMegaOpen(false);
      }
    };
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMegaOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keydown);
    };
  }, [megaOpen]);

  useEffect(() => {
    latestSearch.current = search.trim();
    const q = search.trim();
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q) {
      setResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      const rs = await turso.execute({
        sql: "SELECT id, name, slug, price, image_url, category FROM products WHERE name LIKE ? OR category LIKE ? OR tag LIKE ? ORDER BY created_at DESC LIMIT 6",
        args: [`%${q}%`, `%${q}%`, `%${q}%`],
      });
      if (latestSearch.current === q) {
        setResults(rs.rows as unknown as ProductSearchResult[]);
        setSearchLoading(false);
      }
    }, 250);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [search]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        desktopSearchRef.current?.contains(e.target as Node) ||
        sheetSearchRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setSearchOpen(false);
    };
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keydown);
    };
  }, [searchOpen]);

  function goToResults() {
    const q = search.trim();
    if (!q) return;
    setSearchOpen(false);
    setSheetOpen(false);
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  }

  function selectResult(p: ProductSearchResult) {
    setSearch("");
    setResults([]);
    setSearchOpen(false);
    setSheetOpen(false);
    navigate(`/product/${p.slug}`);
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    goToResults();
  }

  return (
    <>
      <TrustBar />
      <DemoBanner />
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
          {/* Mobile menu trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary lg:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 sm:w-80">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                  {settings.brand_logo ? (
                    <img
                      src={settings.brand_logo}
                      alt={settings.brand_name}
                      className="h-7 w-7 rounded-full object-contain"
                    />
                  ) : (
                    <PawPrint className="h-6 w-6 text-accent" />
                  )}
                  <span className="text-lg font-bold">{settings.brand_name}</span>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                  <div className="space-y-1 px-3">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("nav.pages")}
                    </p>
                    {staticNav.map((n) => (
                      <Link
                        key={n.key}
                        to={n.to}
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        {t(n.key)}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6 space-y-1 px-3">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("nav.categories")}
                    </p>
                    {categories.map((cat) => {
                      const Icon = categoryIcons[cat.slug] || Puzzle;
                      return (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug}`}
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition-colors hover:bg-secondary"
                        >
                          <Icon className="h-4 w-4 text-accent" />
                          {cat.name}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-6 space-y-1 px-3">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("nav.account_section")}
                    </p>
                    {user ? (
                      <>
                        <Link
                          to="/account"
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                        >
                          <User className="h-4 w-4 text-accent" /> {t("nav.account")}
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                        >
                          <Lock className="h-4 w-4 text-accent" /> {t("nav.admin")}
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        <User className="h-4 w-4 text-accent" /> {t("nav.signin")}
                      </Link>
                    )}
                  </div>
                </nav>
                <div className="border-t border-border px-4 py-4">
                  <div ref={sheetSearchRef} className="relative">
                    <form onSubmit={handleSearch} className="relative">
                      <input
                        type="search"
                        placeholder={t("nav.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-4 pr-10 text-sm outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </form>
                    <SearchResults
                      query={search}
                      open={searchOpen}
                      loading={searchLoading}
                      results={results}
                      onSelect={selectResult}
                      onViewAll={goToResults}
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings.brand_logo ? (
              <img
                src={settings.brand_logo}
                alt={settings.brand_name}
                className="h-8 w-8 rounded-xl object-contain sm:h-9 sm:w-9"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground sm:h-9 sm:w-9">
                <PawPrint className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
            )}
            <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              {settings.brand_name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 text-[15px] font-medium lg:flex">
            {staticNav.map((n) => (
              <NavLink
                key={n.key}
                to={n.to}
                end={n.to === "/"}
                data-tour={n.key === "nav.shop" ? "nav-shop" : undefined}
                className={({ isActive }) =>
                  `relative rounded-xl px-3 py-2 transition-colors hover:text-accent ${isActive ? "text-accent after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary" : "text-foreground"}`
                }
              >
                {t(n.key)}
              </NavLink>
            ))}
            <button
              ref={triggerRef}
              onClick={() => setMegaOpen((p) => !p)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-secondary hover:text-accent ${megaOpen ? "text-accent bg-secondary" : "text-foreground"}`}
            >
              {t("nav.categories")}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
              />
            </button>
          </nav>

          {/* Mega menu */}
          {megaOpen && (
            <>
              <div className="fixed inset-0 top-0 z-40" onClick={() => setMegaOpen(false)} />
              <div
                ref={megaRef}
                className="fixed left-1/2 z-50 w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-3 duration-200 top-[76px]"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Shop by category
                  </h3>
                  <Link
                    to="/shop"
                    onClick={() => setMegaOpen(false)}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    View all products &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {categories.map((cat) => {
                    const Icon = categoryIcons[cat.slug] || Puzzle;
                    return (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setMegaOpen(false)}
                        className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-accent/30 hover:bg-accent/5 hover:shadow-sm"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-primary group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize">{cat.name}</p>
                          <p className="text-[11px] text-muted-foreground">Browse products</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("lang.label")}
                title={active?.label}
                className="group inline-flex h-9 shrink-0 items-center gap-2 border border-border bg-card px-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:border-accent/60 hover:bg-secondary/60 data-[state=open]:border-accent data-[state=open]:bg-accent/5"
              >
                <span className="grid h-5 w-8 shrink-0 place-items-center bg-accent/10 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {active?.code}
                </span>
                <span className="hidden whitespace-nowrap sm:inline">{active?.label}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-none border-border p-1.5 shadow-xl shadow-black/10"
              >
                {LANGS.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-none px-2.5 py-2 text-sm focus:bg-accent/10 focus:text-foreground"
                  >
                    <span
                      className={`grid h-5 w-8 shrink-0 place-items-center text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        lang === l.code
                          ? "bg-primary text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {l.code}
                    </span>
                    <span className={lang === l.code ? "font-semibold text-accent" : ""}>
                      {l.label}
                    </span>
                    {lang === l.code && <Check className="ml-auto h-4 w-4 text-accent" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/cart"
              data-tour="nav-cart"
              className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
              aria-label={t("nav.cart")}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <Link
                to="/account"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20"
              >
                <User className="h-4 w-4" />
                <span className="max-w-20 truncate lg:max-w-28">{user.name || user.email}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
                aria-label={t("nav.signin")}
              >
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/admin"
              data-tour="nav-admin"
              className="hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
              aria-label={t("nav.admin")}
            >
              <Lock className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="border-t border-border bg-background/60 px-4 py-3 sm:px-6">
          <div
            ref={desktopSearchRef}
            data-tour="nav-search"
            className="relative mx-auto w-full max-w-2xl"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("nav.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-full border border-border bg-secondary/60 pl-11 pr-24 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white transition-all hover:opacity-90"
              >
                {t("shop.search")}
              </button>
            </form>
            <SearchResults
              query={search}
              open={searchOpen}
              loading={searchLoading}
              results={results}
              onSelect={selectResult}
              onViewAll={goToResults}
            />
          </div>
        </div>
      </header>
    </>
  );
}

function SearchResults({
  query,
  open,
  loading,
  results,
  onSelect,
  onViewAll,
}: {
  query: string;
  open: boolean;
  loading: boolean;
  results: ProductSearchResult[];
  onSelect: (p: ProductSearchResult) => void;
  onViewAll: () => void;
}) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      {loading ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">{t("track.searching")}</p>
      ) : results.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          {t("shop.noProducts")} “{query}”
        </p>
      ) : (
        <>
          <ul className="max-h-80 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-11 w-11 rounded-lg border border-border bg-background object-contain p-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{formatPrice(p.price)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onViewAll}
            className="w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-accent transition-colors hover:bg-secondary"
          >
            View all results for “{query}” &rarr;
          </button>
        </>
      )}
    </div>
  );
}
