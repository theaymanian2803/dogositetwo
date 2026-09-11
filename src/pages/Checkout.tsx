import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/hooks/useCart";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useSettings } from "@/hooks/useSettings";
import { turso } from "@/integrations/turso/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor } from "@/lib/shipping";
import { waLinkFrom } from "@/lib/whatsapp";
import { useI18n } from "@/lib/i18n";
import { Package, User, ArrowRight, MessageCircle } from "lucide-react";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useUserAuth();
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [guestCheckout, setGuestCheckout] = useState(() => {
    try {
      return localStorage.getItem("checkout_guest") === "1";
    } catch {
      return false;
    }
  });
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });
  const shipping = shippingFor(subtotal, {
    threshold: Number(settings.free_shipping_threshold) || FREE_SHIPPING_THRESHOLD,
    fee: Number(settings.shipping_fee) || SHIPPING_FEE,
  });
  const total = subtotal + shipping;

  useEffect(() => {
    document.title = "Checkout — PetPals";
  }, []);

  useEffect(() => {
    if (!user) return;
    const parts = user.name.trim().split(" ");
    setForm((f) => ({
      ...f,
      first_name: f.first_name || (parts[0] ?? ""),
      last_name: f.last_name || parts.slice(1).join(" "),
    }));
  }, [user]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function continueAsGuest() {
    setGuestCheckout(true);
    try {
      localStorage.setItem("checkout_guest", "1");
    } catch {
      /* ignore */
    }
  }

  const orderSummaryBody = (
    <>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden bg-background border border-border">
              <img src={i.image_url} alt={i.name} className="h-full w-full object-contain p-0.5" />
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-medium text-foreground truncate">{i.name}</p>
              <p className="text-muted-foreground">× {i.qty}</p>
            </div>
            <span className="text-sm font-medium text-foreground shrink-0">
              {formatPrice(i.qty * Number(i.price))}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>{t("checkout.subtotal")}</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt>{t("checkout.shipping")}</dt>
          <dd>
            {shipping === 0 ? (
              <span className="text-emerald-600">{t("checkout.free")}</span>
            ) : (
              formatPrice(shipping)
            )}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
          <dt>{t("checkout.total")}</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
    </>
  );

  const orderAside = (
    <aside className="h-fit border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">{t("checkout.yourOrder")}</h2>
      </div>
      <div className="px-6 py-5">{orderSummaryBody}</div>
    </aside>
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setPlacing(true);
    try {
      await turso.execute({
        sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          crypto.randomUUID(),
          form.first_name.trim(),
          form.last_name.trim(),
          form.phone.trim(),
          form.address.trim(),
          JSON.stringify(
            items.map((i) => ({
              id: i.id,
              name: i.name,
              qty: i.qty,
              price: Number(i.price),
              image_url: i.image_url,
            })),
          ),
          total,
        ],
      });
      clear();
      try {
        localStorage.setItem("petpals_last_phone", form.phone.trim());
      } catch {
        /* */
      }
      toast.success("Order placed!", { description: "We'll contact you shortly to confirm." });
      navigate(`/order-confirmed?phone=${encodeURIComponent(form.phone.trim())}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error placing order");
    } finally {
      setPlacing(false);
    }
  };

  const orderViaWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const lines = [
      "🐾 *New Order Request — PetPals*",
      "",
      `👤 *Name:* ${form.first_name.trim()} ${form.last_name.trim()}`,
      `📞 *Phone:* ${form.phone.trim()}`,
      `📍 *Address:* ${form.address.trim()}`,
      "",
      "*Items:*",
      ...items.map((i) => `• ${i.name} ×${i.qty} — ${formatPrice(i.qty * Number(i.price))}`),
      "",
      `*Shipping:* ${shipping === 0 ? "Free" : formatPrice(shipping)}`,
      `*Total:* ${formatPrice(total)}`,
      `*Payment:* Cash on Delivery`,
      "",
      "Our team will get back to you as soon as possible to confirm your order.",
    ];
    const link = waLinkFrom(settings.whatsapp_number, lines.join("\n"));
    if (!link) {
      toast.error("WhatsApp number is not configured");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{t("checkout.empty")}</p>
            <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
              ← {t("checkout.back")}
            </Link>
          </div>
        ) : loading ? (
          <p className="py-20 text-center text-muted-foreground">Loading…</p>
        ) : !user && !guestCheckout ? (
          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-base font-semibold">{t("checkout.title")}</h2>
                </div>
                <div className="px-6 py-8">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("checkout.haveAccount")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("checkout.signIn")}. {t("checkout.guest")}.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/login?redirect=/checkout"
                    className="mt-6 flex w-full items-center justify-center gap-2 border border-accent bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    {t("checkout.signIn")}
                  </Link>
                  <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> {t("checkout.or")}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <button
                    onClick={continueAsGuest}
                    className="flex w-full items-center justify-center gap-2 border border-border py-3 text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    {t("checkout.guest")} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {orderAside}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {user && (
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-card shadow-sm px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" /> {t("checkout.signedInAs")}{" "}
                    <span className="font-medium text-foreground">{user.name}</span>
                  </span>
                  <Link to="/login?redirect=/checkout" className="text-accent hover:underline">
                    {t("checkout.switch")}
                  </Link>
                </div>
              )}
              {!user && guestCheckout && (
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-card shadow-sm px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{t("checkout.guestAs")}</span>
                  <Link to="/login?redirect=/checkout" className="text-accent hover:underline">
                    {t("checkout.signInInstead")}
                  </Link>
                </div>
              )}
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-base font-semibold">{t("checkout.yourDetails")}</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("checkout.firstName")}
                      </label>
                      <input
                        required
                        maxLength={100}
                        placeholder="e.g. John"
                        value={form.first_name}
                        onChange={(e) => update("first_name", e.target.value)}
                        className="h-10 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("checkout.lastName")}
                      </label>
                      <input
                        required
                        maxLength={100}
                        placeholder="e.g. Doe"
                        value={form.last_name}
                        onChange={(e) => update("last_name", e.target.value)}
                        className="h-10 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("checkout.phone")}
                      </label>
                      <input
                        required
                        maxLength={30}
                        type="tel"
                        placeholder="e.g. +1 555-123-4567"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="h-10 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("checkout.address")}
                      </label>
                      <textarea
                        required
                        maxLength={500}
                        placeholder="Street, city, postal code…"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
                      />
                    </div>
                  </div>
                  <p className="mt-5 text-xs text-muted-foreground">
                    {t("checkout.payOnDelivery")}
                  </p>
                </div>
              </div>
            </div>

            <aside className="h-fit overflow-hidden rounded-2xl bg-card shadow-sm">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold">{t("checkout.yourOrder")}</h2>
              </div>
              <div className="px-6 py-5">
                {orderSummaryBody}
                <button
                  type="submit"
                  disabled={placing}
                  className="mt-5 w-full border border-accent bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {placing ? t("checkout.placing") : t("checkout.place")}
                </button>
                <button
                  type="button"
                  onClick={orderViaWhatsApp}
                  className="mt-2 flex w-full items-center justify-center gap-2 border border-emerald-600 bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" /> {t("checkout.whatsapp")}
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t("checkout.payOnDelivery")}
                </p>
              </div>
            </aside>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
