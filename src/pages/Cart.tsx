import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Banknote, MapPin, Trash2, Truck } from "lucide-react";
import Layout from "@/components/Layout";
import QtyStepper from "@/components/QtyStepper";
import { withFallback } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Crumbs, PageMessage, PageSpinner } from "@/components/PageState";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { useProducts } from "@/lib/queries";
import { PLACEHOLDER_IMAGE, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const Cart: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { status, profile } = useAuth();
  const { lines, setQuantity, removeItem, clearCart } = useCart();

  const ids = lines.map((l) => l.productId).join(",");
  const catalogue = useProducts({ ids, limit: 50 }, lines.length > 0);
  const config = useQuery({ queryKey: ["config"], queryFn: () => api.get<{ shippingPerFarmer: number }>("/config"), staleTime: 300_000 });
  const perFarmer = config.data?.shippingPerFarmer ?? 0;

  // Join cart lines with live product data. Anything the server no longer has is flagged, not silently dropped.
  const rows = lines.map((line) => {
    const product = catalogue.data?.items.find((p) => p.id === line.productId);
    const available = product?.quantityAvailable ?? 0;
    return { line, product, available, problem: !product ? "unavailable" : available < line.quantity ? "stock" : null };
  });
  const hasProblem = rows.some((r) => r.problem);

  // Shipping is charged once per farmer, so the basket is grouped into one shipment per farm.
  const shipments = new Map<string, { name: string; rows: typeof rows }>();
  for (const r of rows) {
    const key = r.product?.sellerId ?? "unavailable";
    const name = r.product?.sellerName ?? "Unavailable items";
    if (!shipments.has(key)) shipments.set(key, { name, rows: [] });
    shipments.get(key)!.rows.push(r);
  }
  const farmGroups = [...shipments.entries()].filter(([k]) => k !== "unavailable");
  const farmerCount = farmGroups.length;
  const shipping = perFarmer * farmerCount;
  const subtotal = rows.reduce((sum, r) => (r.product ? sum + r.product.price * r.line.quantity : sum), 0);
  const total = subtotal + shipping;
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const isBuyer = profile?.role === "Buyer";

  const checkout = useMutation({
    mutationFn: () => api.post<Order>("/orders", { items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Order placed", description: "The farmers have been notified." });
      navigate(`/order/${order.id}`, { state: { placed: true } });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Checkout failed", description: err instanceof ApiError ? err.message : "Please try again.", variant: "destructive" });
    },
  });

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="container py-6"><div className="panel"><PageMessage plate="basket" title="Your basket is empty" description="You haven't added anything yet. Fresh produce is waiting." action={{ label: "Start shopping", to: "/products" }} /></div></div>
      </Layout>
    );
  }
  if (catalogue.isLoading) {
    return <Layout><PageSpinner /></Layout>;
  }
  if (catalogue.isError) {
    return (
      <Layout>
        <div className="container py-6"><div className="panel"><PageMessage plate="gate" title="We couldn't load your basket" description="Your items are saved. Please try again." action={{ label: "Try again", onClick: () => catalogue.refetch() }} /></div></div>
      </Layout>
    );
  }

  const checkoutLabel = checkout.isPending ? "Placing order…" : status === "signedOut" ? "Login to place order" : "Place order";
  const blocked = checkout.isPending || hasProblem || status === "loading" || (isBuyer && !profile?.address);

  const handleCheckout = () => {
    if (status === "signedOut") return navigate("/login", { state: { from: "/cart" } });
    if (status === "needsProfile") return navigate("/complete-profile");
    checkout.mutate();
  };

  const line = ({ line: l, product, available, problem }: (typeof rows)[number]) => (
    <li key={l.productId} className={cn("flex gap-3 py-4 sm:gap-4", problem && "bg-turmeric-wash/40")}>
      <img src={product?.imageUrl || PLACEHOLDER_IMAGE} alt="" onError={withFallback} className="h-16 w-16 shrink-0 rounded-lg border border-rule object-cover sm:h-20 sm:w-20" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          {product ? <Link to={`/product/${product.id}`} className="line-clamp-2 text-[14.5px] font-semibold leading-snug hover:text-field">{product.name}</Link> : <span className="text-[14.5px] font-semibold">Unavailable product</span>}
          <p className="mt-0.5 text-xs text-ink-soft">{product ? <><span className="figure">{formatPrice(product.price)}</span> per {product.unit}</> : "This product was removed or sold out."}</p>
          {problem === "stock" && <p className="mt-1 text-xs font-semibold text-turmeric-ink">{available === 0 ? "Sold out" : <>Only {available} left</>}. Reduce the quantity to continue.</p>}
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {product && (
            <QtyStepper
              tone="green"
              size="sm"
              label={product.name}
              value={l.quantity}
              atMin={l.quantity <= 1}
              atMax={l.quantity >= available}
              onDecrease={() => setQuantity(l.productId, l.quantity - 1)}
              onIncrease={() => setQuantity(l.productId, l.quantity + 1)}
            />
          )}
          <p className="figure w-20 text-right text-[15px] font-bold">{product ? formatPrice(product.price * l.quantity) : "—"}</p>
          <button aria-label={`Remove ${product?.name ?? "item"}`} onClick={() => removeItem(l.productId)} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-chili-wash hover:text-chili">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );

  return (
    <Layout>
      <div className="container pb-28 pt-4 md:pb-8 md:pt-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: "My Basket" }]} />
        <h1 className="mb-4 text-xl font-bold md:text-2xl">My Basket <span className="text-base font-medium text-ink-soft">(<span className="figure">{itemCount}</span> {itemCount === 1 ? "item" : "items"})</span></h1>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            {hasProblem && (
              <div className="flex items-start gap-3 rounded-lg border border-turmeric/50 bg-turmeric-wash p-4 text-sm" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-turmeric-ink" />
                <p>Something changed since you added these items. Adjust or remove the highlighted ones to continue.</p>
              </div>
            )}
            {[...shipments.entries()].map(([key, group], i) => (
              <section key={key} className="panel overflow-hidden" aria-label={group.name}>
                <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper-sunk/60 px-4 py-2.5">
                  <p className="flex items-center gap-2 text-sm font-bold"><Truck className="h-4 w-4 text-field" /> {key === "unavailable" ? group.name : <>Shipment {i + 1} · from {group.name}</>}</p>
                  {key !== "unavailable" && <p className="text-xs text-ink-soft">Shipping <span className="figure font-semibold text-ink">{formatPrice(perFarmer)}</span></p>}
                </div>
                <ul className="divide-y divide-rule px-4">{group.rows.map(line)}</ul>
              </section>
            ))}
            <Link to="/products" className="inline-block text-sm font-semibold text-field hover:underline">← Continue shopping</Link>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--header-h)+3.5rem)] lg:self-start" aria-label="Order summary">
            {isBuyer && (
              <div className="panel p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-field" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold">Delivery address</p>
                    {profile?.address ? (
                      <p className="mt-0.5 text-ink-soft">{profile.name}, {profile.address}</p>
                    ) : (
                      <p className="mt-0.5 text-chili">Add an address to place your order.</p>
                    )}
                  </div>
                  <Link to="/profile" className="text-[13px] font-semibold text-field hover:underline">{profile?.address ? "Change" : "Add"}</Link>
                </div>
              </div>
            )}

            <div className="panel p-4">
              <h2 className="text-base font-bold">Bill details</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-ink-soft">Items total</dt><dd className="figure font-medium">{formatPrice(subtotal)}</dd></div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Delivery <span className="figure text-xs">({farmerCount} {farmerCount === 1 ? "farm" : "farms"} × {formatPrice(perFarmer)})</span></dt>
                  <dd className="figure font-medium">{formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-dashed border-rule-strong/60 pt-3 text-base font-bold"><dt>To pay</dt><dd className="figure">{formatPrice(total)}</dd></div>
              </dl>
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-field-wash p-3 text-[13px]"><Banknote className="mt-0.5 h-4 w-4 shrink-0 text-field" /><span><span className="font-bold">Cash on delivery.</span> Nothing is charged online. Prices and stock are re-checked when you order.</span></p>

              {profile?.role === "Farmer" ? (
                <p className="mt-4 text-sm text-ink-soft">Seller accounts can't place orders. Use a buyer account to purchase.</p>
              ) : (
                <Button size="lg" className="mt-4 hidden w-full md:inline-flex" disabled={blocked} onClick={handleCheckout}>
                  {checkoutLabel} <ArrowRight />
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Phone: the total and the order button stay in reach above the tab bar */}
      {profile?.role !== "Farmer" && (
        <div className="fixed inset-x-0 bottom-14 z-40 flex items-center justify-between gap-3 border-t border-rule bg-paper-raised px-4 py-2.5 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden">
          <div>
            <p className="text-[11px] text-ink-soft">To pay on delivery</p>
            <p className="figure text-lg font-extrabold leading-tight">{formatPrice(total)}</p>
          </div>
          <Button size="lg" className="flex-1" disabled={blocked} onClick={handleCheckout}>{checkoutLabel}</Button>
        </div>
      )}
    </Layout>
  );
};

export default Cart;
