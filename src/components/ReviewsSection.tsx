import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { turso } from "@/integrations/turso/client";
import { useI18n } from "@/lib/i18n";

type Review = {
  id: string;
  product_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  body: string;
  product_name: string | null;
  created_at: string;
};

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    turso
      .execute(
        "SELECT r.id, r.product_id, r.user_name, r.rating, r.title, r.body, r.created_at, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT 6",
      )
      .then(({ rows }) => setReviews(rows as unknown as Review[]))
      .catch(() => setReviews([]));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="font-display text-4xl font-bold md:text-5xl">{t("reviews.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          {t("reviews.subtitle")}
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <article key={r.id} className="flex flex-col rounded-2xl bg-card shadow-sm p-6">
            <div className="flex gap-0.5 text-accent">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-30"}`}
                />
              ))}
            </div>
            {r.title && <h3 className="mt-3 font-semibold">{r.title}</h3>}
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {r.body}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{r.user_name}</span>
              {r.product_name && <span className="truncate">{r.product_name}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
