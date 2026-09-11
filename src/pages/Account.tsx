import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "@/hooks/useUserAuth";
import { turso } from "@/integrations/turso/client";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPrice } from "@/lib/currency";
import { Package, User, Mail, LogOut, Phone, Hash, ChevronRight, Search } from "lucide-react";

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

const statusColor: Record<string, string> = {
  new: "bg-blue-500 text-white",
  processing: "bg-amber-500 text-white",
  shipped: "bg-purple-500 text-white",
  delivered: "bg-emerald-500 text-white",
  cancelled: "bg-red-500 text-white",
};

export default function Account() {
  const { user, loading, logout } = useUserAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    document.title = "My Account — PetPals";
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    loadOrders();
  }, [user, loading, navigate]);

  function loadOrders(phone?: string) {
    setOrdersLoading(true);
    const savedPhone =
      phone ||
      (() => {
        try {
          return localStorage.getItem("petpals_last_phone") || "";
        } catch {
          return "";
        }
      })();
    if (!savedPhone) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    turso
      .execute({
        sql: "SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC",
        args: [savedPhone],
      })
      .then((rs) => {
        setOrders(rs.rows as unknown as Order[]);
        setOrdersLoading(false);
      });
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const p = phoneInput.trim();
    if (!p) return;
    localStorage.setItem("petpals_last_phone", p);
    loadOrders(p);
  }

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("account.title")}</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
              <div className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center bg-accent/10 text-accent">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" />{" "}
                      <span className="truncate">{user?.email}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-center gap-2 border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="h-4 w-4" /> {t("account.signOut")}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("track.title")}
                </h3>
              </div>
              <div className="px-6 py-5">
                <form onSubmit={handleLookup} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Phone number used at checkout
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <input
                        type="tel"
                        placeholder="e.g. +1 555-123-4567"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full border border-accent bg-primary py-2 text-sm font-semibold text-white hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    <Search className="h-4 w-4 inline mr-1.5 -mt-0.5" /> {t("account.findOrders")}
                  </button>
                </form>
              </div>
            </div>
          </aside>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-accent" />
              <h2 className="font-display text-xl font-bold">{t("account.myOrders")}</h2>
            </div>

            {ordersLoading ? (
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm p-8 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-base font-semibold text-foreground">No orders found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your phone number to find your orders, or place a new one.
                </p>
                <Link to="/shop" className="btn-accent mt-4 inline-flex px-5">
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => {
                  const parsedItems: OrderItem[] =
                    typeof o.items === "string" ? JSON.parse(o.items) : (o.items ?? []);
                  return (
                    <div key={o.id} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                      <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-border">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            <span>{o.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium mt-1.5">
                            {o.first_name} {o.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {o.phone}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-foreground">
                            {formatPrice(o.total)}
                          </p>
                          <span
                            className={`inline-block mt-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusColor[o.status] || "bg-slate-100 text-slate-700"}`}
                          >
                            {o.status}
                          </span>
                        </div>
                      </div>
                      <div className="px-5 py-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>
                            {new Date(o.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <ChevronRight className="h-3 w-3" />
                          <span className="truncate">{o.address}</span>
                        </div>
                        {parsedItems.length > 0 && (
                          <ul className="space-y-1">
                            {parsedItems.map((it, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs">
                                <span className="flex-1 truncate text-foreground">{it.name}</span>
                                <span className="text-muted-foreground shrink-0">×{it.qty}</span>
                                <span className="font-medium text-foreground shrink-0 w-14 text-right">
                                  {formatPrice(it.qty * it.price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
