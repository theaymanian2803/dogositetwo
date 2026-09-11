import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { turso } from "@/integrations/turso/client";
import { formatPrice } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { PackageSearch, Phone, Search } from "lucide-react";

type OrderItem = { name: string; qty: number; price: number; image_url?: string };

type Order = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: string;
  created_at: string;
};

const statusConfig: Record<string, { pill: string; step: number }> = {
  new: { pill: "bg-blue-50 text-blue-700 ring-blue-600/20", step: 0 },
  processing: {
    pill: "bg-amber-50 text-amber-700 ring-amber-600/20",
    step: 1,
  },
  shipped: { pill: "bg-purple-50 text-purple-700 ring-purple-600/20", step: 2 },
  delivered: {
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    step: 3,
  },
  cancelled: { pill: "bg-red-50 text-red-700 ring-red-600/20", step: -1 },
};

const TIMELINE = ["new", "processing", "shipped", "delivered"];

function parseItems(raw: string): OrderItem[] {
  try {
    return JSON.parse(raw) as OrderItem[];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function OrderCard({ order }: { order: Order }) {
  const { t } = useI18n();
  const items = parseItems(order.items);
  const status = statusConfig[order.status] ?? { pill: "", step: 0 };
  const cancelled = order.status === "cancelled";
  const statusLabel = t(`track.status.${order.status}`);

  return (
    <div className="rounded-2xl bg-card shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {order.first_name} {order.last_name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("track.placed", { date: formatDate(order.created_at) })} · {order.phone}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.pill}`}>
          {statusLabel}
        </span>
      </div>

      {!cancelled && (
        <ol className="mt-6 flex items-center">
          {TIMELINE.map((key, i) => {
            const done = i <= status.step;
            return (
              <li key={key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                      done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`mt-1.5 hidden text-[11px] font-medium sm:block ${
                      done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t(`track.status.${key}`)}
                  </span>
                </div>
                {i < TIMELINE.length - 1 && (
                  <span
                    className={`mx-2 mb-0 h-0.5 flex-1 rounded-full sm:mb-5 ${
                      i < status.step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <ul className="mt-5 space-y-2 border-t border-border pt-4">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">
              {it.name} <span className="text-foreground">× {it.qty}</span>
            </span>
            <span className="shrink-0 font-medium">{formatPrice(it.qty * Number(it.price))}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm">
        <span className="text-xs text-muted-foreground">{order.address || "Pickup in store"}</span>
        <span className="font-semibold">
          {t("track.total")} <span className="text-accent">{formatPrice(order.total)}</span> —{" "}
          {t("track.payOnDelivery")}
        </span>
      </div>
    </div>
  );
}

export default function Track() {
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [searched, setSearched] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    document.title = "Track your order — PetPals";
  }, []);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    const q = phone.trim();
    if (!q) return;
    setLoading(true);
    setNotFound(false);
    try {
      const rs = await turso.execute({
        sql: "SELECT id, first_name, last_name, phone, address, items, total, status, created_at FROM orders WHERE phone = ? ORDER BY created_at DESC",
        args: [q],
      });
      setOrders(rs.rows as unknown as Order[]);
      setNotFound(rs.rows.length === 0);
      setSearched(q);
    } catch {
      setOrders([]);
      setNotFound(true);
      setSearched(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10">
            <PackageSearch className="h-7 w-7 text-accent" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
            {t("track.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("track.subtitle")}</p>
        </div>

        <form onSubmit={search} className="mx-auto mt-8 flex max-w-md gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 06 12 34 56 78"
              className="h-12 w-full rounded-full bg-card shadow-sm pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            disabled={loading}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? t("track.searching") : t("track.search")}
          </button>
        </form>

        {loading && (
          <p className="mt-10 text-center text-sm text-muted-foreground">{t("track.searching")}</p>
        )}

        {!loading && notFound && (
          <div className="mt-10 rounded-2xl bg-card shadow-sm p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {t("track.empty", { phone: searched })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("track.emptyHint")}</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-10 space-y-6">
            <p className="text-sm text-muted-foreground">
              {t(orders.length > 1 ? "track.foundPlural" : "track.found", {
                count: orders.length,
                phone: searched,
              })}
            </p>
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
            <p className="text-center text-xs text-muted-foreground">
              {t("track.contact")}{" "}
              <Link to="/contact" className="text-accent hover:underline">
                {t("track.contactUs")}
              </Link>{" "}
              — {t("track.payOnDelivery")}
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
