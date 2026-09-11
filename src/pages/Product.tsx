import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { turso } from "@/integrations/turso/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BadgeCheck, Send, ShoppingBag, Heart, Star, Upload } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useUserAuth } from "@/hooks/useUserAuth";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/useSettings";
import { useI18n } from "@/lib/i18n";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  images: string | null;
  category: string;
  badge: string | null;
  tag: string | null;
};

const parseImages = (raw: string | null): string[] => {
  try {
    const arr = JSON.parse(raw ?? "[]");
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
};

type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  body: string;
  image_url: string | null;
  status: string;
  created_at: string;
};

function Stars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${i <= rating ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </span>
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const { settings } = useSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const { add } = useCart();
  const { user, loading: userLoading } = useUserAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "", image_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    setActive(0);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rs = await turso.execute({
          sql: "SELECT * FROM products WHERE slug = ? LIMIT 1",
          args: [slug],
        });
        const data = rs.rows[0] as unknown as Product | undefined;
        setProduct(data ?? null);
        if (data) {
          document.title = `${data.name} — PetPals`;
          const [relRs, revRs] = await Promise.all([
            turso.execute({
              sql: "SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4",
              args: [data.category, data.id],
            }),
            turso
              .execute({
                sql: "SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC",
                args: [data.id],
              })
              .catch(() => ({ rows: [] })),
          ]);
          setRelated(relRs.rows as unknown as Product[]);
          setReviews(revRs.rows as unknown as Review[]);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length
    : 0;
  const breakdown = [1, 2, 3, 4, 5].map(
    (n) => reviews.filter((r) => Number(r.rating) === n).length,
  );

  function handleReviewUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReviewForm({ ...reviewForm, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !user) return;
    setSubmitting(true);
    try {
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS reviews (
          id         TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          user_id    TEXT,
          user_name  TEXT NOT NULL,
          rating     INTEGER NOT NULL,
          title      TEXT,
          body       TEXT NOT NULL,
          image_url  TEXT,
          status     TEXT NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await turso.execute({
        sql: "INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, body, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
        args: [
          crypto.randomUUID(),
          product.id,
          user.id,
          user.name,
          reviewForm.rating,
          reviewForm.title.trim() || null,
          reviewForm.body.trim(),
          reviewForm.image_url || null,
        ],
      });
      toast.success("Review submitted! It will appear once approved.");
      setReviewForm({ rating: 5, title: "", body: "", image_url: "" });
      const revRs = await turso.execute({
        sql: "SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC",
        args: [product.id],
      });
      setReviews(revRs.rows as unknown as Review[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">{t("product.loadError")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link to="/" className="mt-5 inline-block text-accent hover:underline">
            ← Back to store
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="text-3xl font-bold">{t("product.notFound")}</h1>
          <Link to="/" className="mt-4 inline-block text-accent hover:underline">
            ← Back to store
          </Link>
        </div>
      </div>
    );
  }

  const gallery = [product.image_url, ...parseImages(product.images)].filter(
    (u): u is string => !!u,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="capitalize">{product.category}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/70">
              {product.badge && (
                <span className="absolute left-5 top-5 z-10 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                  {product.badge}
                </span>
              )}
              <img
                src={gallery[active] ?? product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-8"
              />
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`aspect-square overflow-hidden rounded-2xl border bg-card transition-all ${
                      i === active
                        ? "border-accent ring-2 ring-accent/25"
                        : "border-border hover:border-accent/40"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {product.category}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">{product.name}</h1>
            {reviews.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Stars rating={Math.round(avgRating)} />
                <span className="ml-2 text-sm text-muted-foreground">
                  {avgRating.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <p className="mt-6 font-display text-4xl font-bold text-accent">
              {formatPrice(product.price)}
            </p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

            {product.tag && (
              <div className="mt-6">
                <span className="text-sm text-muted-foreground">{t("product.size")} </span>
                <span className="inline-block rounded-full bg-card shadow-sm px-4 py-1 text-sm">
                  {product.tag}
                </span>
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-full bg-card shadow-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 text-lg">
                  −
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="h-11 w-11 text-lg">
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  add(
                    {
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: Number(product.price),
                      image_url: product.image_url,
                    },
                    qty,
                  );
                  toast.success(`${product.name} added to cart`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4" /> {t("products.add")}
              </button>
              <button
                className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
                aria-label="Save"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl bg-card shadow-sm p-5 text-center text-xs text-muted-foreground">
              <div>
                <p className="font-display font-semibold text-foreground">
                  {t("product.freeShipping")}
                </p>
                <p className="mt-1">
                  {t("product.overThreshold", {
                    threshold: Number(settings.free_shipping_threshold) || 500,
                  })}
                </p>
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{t("product.returns")}</p>
                <p className="mt-1">{t("product.returnsSub")}</p>
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">
                  {t("product.vetApproved")}
                </p>
                <p className="mt-1">{t("product.vetApprovedSub")}</p>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-3xl font-bold">{t("product.related")}</h2>
            <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
              {related.map((p) => (
                <div key={p.id} className="group rounded-2xl bg-card shadow-sm p-3 card-lift">
                  <Link to={`/product/${p.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/70">
                      {p.badge && (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                          {p.badge}
                        </span>
                      )}
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-1 pb-1 pt-3 text-center">
                      <h3 className="font-display text-sm font-semibold leading-snug">{p.name}</h3>
                      <p className="mt-1 text-sm font-bold text-accent">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───── REVIEWS ───── */}
        <section className="mt-24">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">{t("product.reviews")}</h2>
              <div className="mt-4 flex items-center gap-4">
                <span className="font-display text-5xl font-bold tracking-tight">
                  {reviews.length > 0 ? avgRating.toFixed(1) : "—"}
                </span>
                <div>
                  <Stars rating={Math.round(avgRating)} className="h-5 w-5" />
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {reviews.length > 0
                      ? `Based on ${reviews.length} verified review${reviews.length > 1 ? "s" : ""}`
                      : "Be the first to review this product"}
                  </p>
                </div>
              </div>
              {reviews.length > 0 && (
                <div className="mt-5 max-w-sm space-y-1.5">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const pct = reviews.length
                      ? Math.round((breakdown[n - 1] / reviews.length) * 100)
                      : 0;
                    return (
                      <div
                        key={n}
                        className="flex items-center gap-3 text-xs text-muted-foreground"
                      >
                        <span className="flex w-8 items-center gap-1">
                          {n} <Star className="h-3 w-3 fill-accent text-accent" />
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right tabular-nums">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {user && (
              <button
                onClick={() =>
                  document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" /> Write a review
              </button>
            )}
          </div>

          {/* Review form */}
          {userLoading ? null : user ? (
            <form
              id="review-form"
              onSubmit={submitReview}
              className="mt-8 rounded-2xl bg-card shadow-sm p-6 sm:p-8"
            >
              <h3 className="text-lg font-bold tracking-tight">{t("product.share")}</h3>
              <div className="mt-5 flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("product.yourRating")}
                </span>
                <div className="ml-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`Rate ${i} out of 5 stars`}
                    >
                      <Star
                        className={`h-7 w-7 ${i <= reviewForm.rating ? "fill-accent text-accent" : "text-border"}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-foreground">
                    {reviewForm.rating}/5
                  </span>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                <input
                  placeholder={t("product.reviewTitle")}
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="h-11 w-full rounded-full border border-border bg-background px-5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
                <textarea
                  required
                  placeholder={t("product.reviewBody")}
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-background px-5 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => reviewFileRef.current?.click()}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                      >
                        <Upload className="h-4 w-4" />
                        {reviewForm.image_url ? "Change photo" : "Add a photo"}
                      </button>
                      {reviewForm.image_url && (
                        <img
                          src={reviewForm.image_url}
                          alt="Review preview"
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      )}
                      <input
                        ref={reviewFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReviewUpload}
                        className="hidden"
                      />
                    </div>
                    <input
                      type="url"
                      placeholder={t("product.imageLink")}
                      value={reviewForm.image_url}
                      onChange={(e) => setReviewForm({ ...reviewForm, image_url: e.target.value })}
                      className="h-10 w-full rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/25 sm:max-w-xs"
                    />
                  </div>
                  <button
                    disabled={submitting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submit review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Have experience with this product? Sign in to leave a review.
              </p>
              <Link
                to={`/login?redirect=/product/${product.slug}`}
                className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                Sign in to review
              </Link>
            </div>
          )}

          {/* Review list */}
          <div className="mt-10 space-y-5">
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet — your review could be the first!
              </p>
            )}
            {reviews.map((r) => {
              const dateStr = new Date(r.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const initials =
                (r.user_name?.[0] ?? "?").toUpperCase() + (r.user_name?.[1] ?? "").toUpperCase();
              return (
                <article
                  key={r.id}
                  className="flex flex-col gap-5 rounded-2xl bg-card shadow-sm p-6 sm:flex-row"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-secondary sm:h-24 sm:w-24">
                    {r.image_url ? (
                      <img
                        src={r.image_url}
                        alt={`Photo from ${r.user_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Stars rating={Number(r.rating)} />
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.user_name}</span>
                      <span className="text-xs text-muted-foreground">· {dateStr}</span>
                    </div>
                    {r.title && (
                      <h4 className="mt-2.5 text-sm font-bold tracking-tight text-foreground">
                        {r.title}
                      </h4>
                    )}
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{r.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
