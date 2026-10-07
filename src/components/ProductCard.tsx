import React from "react";
import { Link } from "react-router-dom";
import ProductionBadge from "@/components/ProductionBadge";
import QtyStepper from "@/components/QtyStepper";
import { RatingChip } from "@/components/Stars";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PLACEHOLDER_IMAGE, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const withFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null; // avoid a loop if the fallback itself fails
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const LOW = 10;

/**
 * Product tile: photo, seller, name, unit, rating, price and an Add button that becomes a quantity stepper.
 * `headingLevel` keeps the page outline valid: 3 under a section heading (home), 2 directly under the page's h1.
 */
const ProductCard: React.FC<{ product: Product; headingLevel?: 2 | 3; className?: string }> = ({ product, headingLevel = 3, className }) => {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const { addItem, setQuantity, removeItem, lines } = useCart();
  const { userType } = useAuth();
  const { toast } = useToast();
  const soldOut = product.quantityAvailable <= 0;
  const inBasket = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const off = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const low = !soldOut && product.quantityAvailable <= LOW;

  const handleAdd = () => {
    const { added, reason } = addItem(product.id, 1, product.quantityAvailable);
    if (added > 0) return;
    if (reason === "full") toast({ title: "Your basket is full", description: "A basket holds up to 50 different products. Check out or remove something first.", variant: "destructive" });
    else toast({ title: "That's all there is", description: `Only ${product.quantityAvailable} ${product.unit} available.`, variant: "destructive" });
  };

  return (
    <article className={cn("group flex h-full flex-col overflow-hidden rounded-lg border border-rule bg-paper-raised transition-shadow hover:shadow-lg", className)}>
      <Link to={`/product/${product.id}`} aria-label={product.name} className="relative block bg-paper-sunk">
        <div className="aspect-square overflow-hidden">
          <img
            src={product.imageUrl || PLACEHOLDER_IMAGE}
            alt=""
            loading="lazy"
            onError={withFallback}
            className={cn("h-full w-full object-cover transition-transform duration-300 group-hover:scale-105", soldOut && "opacity-50 grayscale")}
          />
        </div>
        {off > 0 && !soldOut && <span className="absolute right-2 top-0 rounded-b bg-field px-1.5 pb-1 pt-0.5 text-center text-[11px] font-bold leading-tight text-white"><span className="figure block text-[13px]">{off}%</span>OFF</span>}
        {low && <span className="absolute left-0 top-2.5 rounded-r bg-turmeric px-2 py-0.5 text-[11px] font-bold text-ink">Only {product.quantityAvailable} left</span>}
        {soldOut && <span className="absolute left-0 top-2.5 rounded-r bg-ink px-2 py-0.5 text-[11px] font-bold text-white">Out of stock</span>}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={`/products?seller=${encodeURIComponent(product.sellerId)}`} className="truncate text-xs font-medium text-ink-soft hover:text-field hover:underline">
          {product.sellerName}
        </Link>
        <Link to={`/product/${product.id}`}>
          <Heading className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-5 hover:text-field">{product.name}</Heading>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded border border-rule bg-paper-sunk px-2 py-0.5 text-xs font-medium">1 {product.unit}</span>
          <ProductionBadge type={product.productionType} />
        </div>

        <div className="mt-2 h-5">{product.reviews > 0 && <RatingChip value={product.rating} count={product.reviews} />}</div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span className="figure text-[17px] font-bold leading-none">{formatPrice(product.price)}</span>{off > 0 && <span className="figure text-xs text-ink-soft line-through">{formatPrice(product.mrp!)}</span>}</p>
            <p className="mt-1 truncate text-[11px] text-ink-soft">per {product.unit}</p>
          </div>
          {userType === "Farmer" ? (
            <Button asChild variant="outline" size="sm"><Link to={`/product/${product.id}`}>View</Link></Button>
          ) : soldOut ? (
            <Button size="sm" variant="secondary" disabled>Sold out</Button>
          ) : inBasket > 0 ? (
            <QtyStepper
              size="sm"
              label={product.name}
              value={inBasket}
              atMax={inBasket >= product.quantityAvailable}
              onIncrease={() => addItem(product.id, 1, product.quantityAvailable)}
              onDecrease={() => (inBasket <= 1 ? removeItem(product.id) : setQuantity(product.id, inBasket - 1))}
            />
          ) : (
            <Button size="sm" variant="addOutline" className="h-9 min-w-[4.5rem] px-4 uppercase tracking-wide" onClick={handleAdd} aria-label={`Add ${product.name} to basket`}>
              Add
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
