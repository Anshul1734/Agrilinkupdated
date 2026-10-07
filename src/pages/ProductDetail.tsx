import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Banknote, Check, ShieldCheck, Store, Truck } from "lucide-react";
import Layout from "@/components/Layout";
import ProductionBadge from "@/components/ProductionBadge";
import ProductReviews from "@/components/ProductReviews";
import ProductRail from "@/components/ProductRail";
import QtyStepper from "@/components/QtyStepper";
import { RatingChip } from "@/components/Stars";
import { withFallback } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Crumbs, PageMessage, PageSpinner } from "@/components/PageState";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProduct } from "@/lib/queries";
import { PLACEHOLDER_IMAGE, formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addItem, lines } = useCart();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);

  if (isLoading) {
    return <Layout><PageSpinner /></Layout>;
  }
  if (isError || !product) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return (
      <Layout>
        <div className="container py-6">
          <div className="panel">
            <PageMessage
              plate={notFound ? "search" : "gate"}
              title={notFound ? "This product isn't available" : "This product didn't load"}
              description={notFound ? "The farmer may have removed it, or the link is wrong." : "Please try again in a moment."}
              action={notFound ? { label: "Browse all products", to: "/products" } : { label: "Try again", onClick: () => refetch() }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, product.quantityAvailable - inCart);
  const soldOut = product.quantityAvailable <= 0;
  const isOwner = profile?.uid === product.sellerId;
  const isFarmer = profile?.role === "Farmer";
  const qty = Math.min(quantity, Math.max(1, remaining));

  const handleAdd = () => {
    const { added, reason } = addItem(product.id, qty, product.quantityAvailable);
    if (added > 0) {
      toast({ title: "Added to basket", description: `${added} ${product.unit} of ${product.name}.` });
      setQuantity(1);
    } else if (reason === "full") {
      toast({ title: "Your basket is full", description: "A basket holds up to 50 different products. Check out or remove something first.", variant: "destructive" });
    } else {
      toast({ title: "That's all there is", description: `You already have all ${product.quantityAvailable} ${product.unit} in your basket.`, variant: "destructive" });
    }
  };

  const details: [string, React.ReactNode][] = [
    ["Sold by", <Link key="s" to={`/products?seller=${encodeURIComponent(product.sellerId)}`} className="link font-semibold">{product.sellerName}</Link>],
    ["Category", <Link key="c" to={`/category/${product.categoryId}`} className="link font-semibold">{product.categoryName}</Link>],
    ["How it's grown", product.productionType ?? "Not stated"],
    ["Sold in units of", product.unit],
    ["Listed on", <span key="l" className="figure">{formatDate(product.created_at)}</span>],
  ];

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: product.categoryName, to: `/category/${product.categoryId}` }, { label: product.name }]} />

        <div className="panel grid gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
          <div className="relative overflow-hidden rounded-lg border border-rule bg-paper-sunk lg:self-start">
            <img src={product.imageUrl || PLACEHOLDER_IMAGE} alt={product.name} onError={withFallback} className={cn("aspect-square w-full object-cover", soldOut && "opacity-50 grayscale")} />
            {soldOut && <span className="absolute left-0 top-4 rounded-r bg-ink px-3 py-1 text-xs font-bold text-white">Out of stock</span>}
          </div>

          <div>
            <Link to={`/products?seller=${encodeURIComponent(product.sellerId)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-field hover:underline">
              <Store className="h-4 w-4" /> {product.sellerName}
            </Link>
            <h1 className="mt-1 text-2xl font-bold leading-tight md:text-[1.75rem]">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {product.reviews > 0 && <a href="#reviews" className="hover:underline"><RatingChip value={product.rating} count={product.reviews} /></a>}
              <ProductionBadge type={product.productionType} />
            </div>

            <div className="mt-4 border-t border-rule pt-4">
              <p className="flex items-baseline gap-2">
                <span className="figure text-[2rem] font-extrabold leading-none">{formatPrice(product.price)}</span>
                {product.mrp && product.mrp > product.price && <><span className="figure text-base text-ink-soft line-through">{formatPrice(product.mrp)}</span><span className="figure rounded bg-field px-1.5 py-0.5 text-xs font-bold text-white">{Math.round((1 - product.price / product.mrp) * 100)}% OFF</span></>}
                <span className="text-sm text-ink-soft">per {product.unit}</span>
              </p>
              <p className="mt-1 text-xs text-ink-soft">Set by the farmer. Shipping is charged once per farm and shown at checkout.</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-bold">Pack size</p>
              <span className="inline-flex items-center gap-2 rounded-lg border-2 border-field bg-field-wash px-4 py-2 text-sm font-semibold">
                <Check className="h-4 w-4 text-field" strokeWidth={3} /> 1 {product.unit} <span className="figure font-bold">{formatPrice(product.price)}</span>
              </span>
              <p className={cn("mt-3 flex items-center gap-2 text-[13px] font-medium", soldOut ? "text-chili" : product.quantityAvailable > 10 ? "text-field" : "text-turmeric-ink")}>
                <span className={cn("h-2 w-2 rounded-full", soldOut ? "bg-chili" : product.quantityAvailable > 10 ? "bg-field" : "bg-turmeric")} aria-hidden="true" />
                {soldOut ? "Currently out of stock" : product.quantityAvailable > 10 ? <><span className="figure">{product.quantityAvailable}</span> {product.unit} in stock</> : <>Hurry, only <span className="figure">{product.quantityAvailable}</span> {product.unit} left</>}
              </p>
            </div>

            <div className="mt-5">
              {isOwner ? (
                <div className="rounded-lg border border-turmeric/50 bg-turmeric-wash/60 p-4 text-sm">
                  This is your listing. <Link to="/farmer-dashboard" className="link font-semibold">Edit price and stock on your farm page</Link>.
                </div>
              ) : isFarmer ? (
                <p className="rounded-lg bg-paper-sunk p-4 text-sm text-ink-soft">Seller accounts can't place orders. Sign in with a buyer account to purchase.</p>
              ) : soldOut || remaining === 0 ? (
                <Button disabled size="lg" className="w-full sm:w-auto">{soldOut ? "Out of stock" : "All available units are in your basket"}</Button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <QtyStepper tone="plain" label={product.name} value={qty} atMin={qty <= 1} atMax={qty >= remaining} onDecrease={() => setQuantity(qty - 1)} onIncrease={() => setQuantity(qty + 1)} />
                  <Button variant="add" size="lg" className="min-w-[12rem] flex-1 sm:flex-none" onClick={handleAdd}>
                    Add to basket · <span className="figure">{formatPrice(product.price * qty)}</span>
                  </Button>
                </div>
              )}
              {inCart > 0 && !isOwner && !isFarmer && <p className="mt-2 text-[13px] text-ink-soft"><span className="figure font-semibold text-ink">{inCart}</span> {product.unit} already in your basket. <Link to="/cart" className="link font-semibold">View basket</Link></p>}
            </div>

            <ul className="mt-6 grid gap-3 rounded-lg border border-rule p-4 text-[13px] sm:grid-cols-3">
              {[
                [Banknote, "Pay on delivery", "Cash when it arrives"],
                [Truck, "Shipped by the farmer", product.sellerName],
                [ShieldCheck, "Verified reviews", "Delivered orders only"],
              ].map(([Icon, t, s]) => {
                const I = Icon as React.ElementType;
                return (
                  <li key={t as string} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field-wash text-field"><I className="h-4 w-4" /></span>
                    <span className="min-w-0"><span className="block font-semibold leading-tight">{t as string}</span><span className="block truncate text-ink-soft">{s as string}</span></span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {product.description && (
            <section className="panel p-4 md:p-6" aria-labelledby="about-h">
              <h2 id="about-h" className="text-lg font-bold">About this product</h2>
              <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed">{product.description}</p>
            </section>
          )}
          <section className={cn("panel p-4 md:p-6", !product.description && "lg:col-span-2")} aria-labelledby="det-h">
            <h2 id="det-h" className="text-lg font-bold">Product details</h2>
            <dl className="mt-2 divide-y divide-rule text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <ProductReviews product={product} />
      </div>

      <ProductRail id="more-seller" title={`More from ${product.sellerName}`} to={`/products?seller=${encodeURIComponent(product.sellerId)}`} filters={{ sellerId: product.sellerId, inStock: true, limit: 13 }} excludeId={product.id} />
    </Layout>
  );
};

export default ProductDetail;
