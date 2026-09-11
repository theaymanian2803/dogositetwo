import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice } from "@/lib/currency";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor } from "@/lib/shipping";
import { useI18n } from "@/lib/i18n";
import { Trash2, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, subtotal, setQty, remove } = useCart();
  const { settings } = useSettings();
  const { t } = useI18n();
  const shipping = shippingFor(subtotal, {
    threshold: Number(settings.free_shipping_threshold) || FREE_SHIPPING_THRESHOLD,
    fee: Number(settings.shipping_fee) || SHIPPING_FEE,
  });
  const total = subtotal + shipping;

  useEffect(() => {
    document.title = "Your Cart — PetPals";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-4xl font-bold">{t("cart.title")}</h1>

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl bg-card shadow-sm p-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-5 text-lg">{t("cart.empty")}</p>
            <Link to="/" className="btn-accent mt-7 inline-flex">
              {t("cart.browse")}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center gap-4 rounded-2xl bg-card shadow-sm p-4"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary/70">
                    <img
                      src={i.image_url}
                      alt={i.name}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <Link
                      to={`/product/${i.slug}`}
                      className="font-display font-semibold hover:text-accent"
                    >
                      {i.name}
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-accent">{formatPrice(i.price)}</p>
                  </div>
                  <div className="flex items-center rounded-full border border-border">
                    <button onClick={() => setQty(i.id, i.qty - 1)} className="h-9 w-9">
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{i.qty}</span>
                    <button onClick={() => setQty(i.id, i.qty + 1)} className="h-9 w-9">
                      +
                    </button>
                  </div>
                  <p className="w-20 text-right font-semibold">
                    {formatPrice(i.qty * Number(i.price))}
                  </p>
                  <button
                    onClick={() => remove(i.id)}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
                    aria-label={t("cart.remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-2xl bg-card shadow-sm p-6">
              <h2 className="font-display text-xl font-bold">{t("cart.subtotal")}</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>{t("cart.subtotal")}</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("cart.shipping")}</dt>
                  <dd>{shipping === 0 ? t("cart.free") : formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <dt>{t("cart.total")}</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>
              <Link
                to="/checkout"
                className="mt-6 block rounded-full bg-primary py-3 text-center font-semibold text-white hover:opacity-90"
              >
                {t("cart.checkout")}
              </Link>
              <Link
                to="/"
                className="mt-3 block text-center text-sm text-muted-foreground hover:text-accent"
              >
                {t("cart.browse")}
              </Link>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
