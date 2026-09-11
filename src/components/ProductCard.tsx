import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

export type ProductCardProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  badge: string | null;
  tag: string | null;
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const { add } = useCart();
  const { t } = useI18n();

  return (
    <div className="group relative flex flex-col rounded-2xl bg-card p-3 shadow-sm card-lift">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/70">
          {product.badge && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
              {product.badge}
            </span>
          )}
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="px-2 pb-1 pt-4 text-center">
          <h3 className="font-display text-[15px] font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1.5 text-sm font-bold text-accent">{formatPrice(product.price)}</p>
          {product.tag && (
            <span className="mt-2 inline-block rounded-full border border-border bg-background px-3 py-0.5 text-xs text-muted-foreground">
              {product.tag}
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          add({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            image_url: product.image_url,
          });
          toast.success(`${product.name} added to cart`);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <ShoppingBag className="h-3.5 w-3.5" /> {t("products.add")}
      </button>
    </div>
  );
}
