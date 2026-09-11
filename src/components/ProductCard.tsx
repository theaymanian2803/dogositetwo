import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
    <div className="group relative flex flex-col justify-between rounded-[2.5rem] bg-card p-4 shadow-sm card-lift">
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image Container with Badge Overlay */}
        <div className="relative aspect-square w-full overflow-hidden rounded-[1.75rem] bg-secondary/70 p-4">
          {product.badge && (
            <span className="absolute z-10 px-3 py-1 text-xs font-bold rounded-full left-3 top-3 bg-primary text-primary-foreground">
              {product.badge}
            </span>
          )}
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-1.5 px-2 pb-2 pt-5">
          <h3 className="text-xl font-bold tracking-tight font-display text-foreground">
            {product.name}
          </h3>

          {product.tag && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {product.tag}
            </p>
          )}
        </div>
      </Link>

      {/* Footer / Price & Action Area */}
      <div className="flex items-center justify-between gap-3 px-2 pt-2 mt-4">
        <span className="text-lg font-bold text-accent">{formatPrice(product.price)}</span>

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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {t("products.add")}
        </button>
      </div>
    </div>
  );
}
