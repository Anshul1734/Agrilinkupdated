import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, CircleCheck, MapPin, Phone, Star } from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import OrderTrack from "@/components/OrderTrack";
import { PageMessage, PageSpinner } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { useOrder } from "@/lib/queries";
import { MOVE_LABEL, allowedMoves, currentTotal } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderItem, OrderStatus } from "@/types";

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const placed = !!(useLocation().state as { placed?: boolean } | null)?.placed;
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const [confirmCancel, setConfirmCancel] = useState<OrderItem | null>(null);

  const move = useMutation({
    mutationFn: ({ item, status }: { item: OrderItem; status: OrderStatus }) =>
      api.patch(`/orders/items/${item.id}/status`, { status }),
    onSuccess: (_d, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      toast({ title: `Item marked ${status.toLowerCase()}` });
    },
    onError: (err) => {
      // The row may have changed under us (e.g. the other party cancelled): reload it.
      queryClient.invalidateQueries({ queryKey: ["order"] });
      toast({ title: "Couldn't update the item", description: err instanceof ApiError ? err.message : "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) return <Layout><PageSpinner /></Layout>;
  if (isError || !order || !profile) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return (
      <Layout>
        <div className="container py-6"><div className="panel">
          <PageMessage
            plate={notFound ? "search" : "gate"}
            title={notFound ? "Order not found" : "This order didn't load"}
            description={notFound ? "It doesn't exist, or it belongs to someone else." : undefined}
            action={notFound ? { label: "Back to orders", to: "/orders" } : { label: "Try again", onClick: () => refetch() }}
          />
        </div></div>
      </Layout>
    );
  }

  const isBuyer = order.buyerId === profile.uid;
  const actor = isBuyer ? "buyer" : "seller";
  const several = order.items.some((i) => i.sellerId !== order.items[0].sellerId);
  const payLabel = order.paymentStatus === "Due" ? (isBuyer ? "Pay on delivery" : "Collect on delivery") : order.paymentStatus === "Paid" ? "Paid" : "Nothing due";

  return (
    <AccountLayout
      title={`Order #${order.id}`}
      subtitle={`Placed on ${formatDate(order.created_at)}${isBuyer ? "" : ` by ${order.buyerName}`}`}
      actions={<StatusBadge status={order.status} className="text-[13px]" />}
      crumbs={[{ label: isBuyer ? "My Orders" : "Sales orders", to: "/orders" }, { label: `#${order.id}` }]}
    >
      {placed && isBuyer && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-field/30 bg-field-wash p-4" role="status">
          <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-field" />
          <div>
            <p className="font-bold text-field">Your order has been placed!</p>
            <p className="mt-0.5 text-sm">The {several ? "farmers have" : "farmer has"} been told. You'll get a notification when each item moves, and you pay in cash when it arrives.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <section className="panel" aria-labelledby="items-h">
          <h2 id="items-h" className="border-b border-rule px-4 py-3 text-base font-bold">Items in this order</h2>
          <ul className="divide-y divide-rule px-4">
            {order.items.map((item) => {
              const moves = allowedMoves(item.status, actor);
              return (
                <li key={item.id} className={cn("py-4", item.status === "Cancelled" && "opacity-75")}>
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">{item.productId ? <Link to={`/product/${item.productId}`} className="hover:text-field hover:underline">{item.productName}</Link> : item.productName}</p>
                      <p className="mt-0.5 text-[13px] text-ink-soft">
                        <span className="figure">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span> × <span className="figure">{formatPrice(item.unitPrice)}</span>
                        {isBuyer && item.sellerName ? <> · Sold by {item.sellerName}</> : null}
                      </p>
                    </div>
                    <p className={cn("figure text-base font-bold", item.status === "Cancelled" && "line-through")}>{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>

                  <OrderTrack status={item.status} className="mt-4 max-w-lg" />

                  {(moves.length > 0 || (isBuyer && item.status === "Delivered" && item.productId)) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {isBuyer && item.status === "Delivered" && item.productId && (
                        <Button size="sm" variant="outline" asChild><Link to={`/product/${item.productId}#reviews`}><Star /> Rate this product</Link></Button>
                      )}
                      {moves.map((next) =>
                        next === "Cancelled" ? (
                          <Button key={next} size="sm" variant="outline" className="border-chili/40 text-chili hover:bg-chili-wash hover:text-chili" disabled={move.isPending} onClick={() => setConfirmCancel(item)}>
                            {isBuyer ? "Cancel item" : "Cancel"}
                          </Button>
                        ) : (
                          <Button key={next} size="sm" disabled={move.isPending} onClick={() => move.mutate({ item, status: next })}>{MOVE_LABEL[next]}</Button>
                        ),
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {isBuyer && several && <p className="border-t border-rule bg-paper-sunk/50 px-4 py-3 text-[13px] text-ink-soft">This order has items from several farms. Each farm prepares and ships its own items, so progress can differ.</p>}
        </section>

        <aside className="space-y-4">
          <section className="panel p-4" aria-labelledby="deliver-h">
            <h2 id="deliver-h" className="mb-3 text-base font-bold">{isBuyer ? "Delivery address" : "Deliver to"}</h2>
            <address className="space-y-2 text-sm not-italic">
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-field" /><span><span className="font-semibold">{order.buyerName}</span><br />{order.shippingAddress || "No address on file"}</span></p>
              {order.contactNumber && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-field" /><a href={`tel:${order.contactNumber}`} className="figure link">{order.contactNumber}</a></p>}
            </address>
          </section>

          <section className="panel p-4" aria-labelledby="pay-h">
            <h2 id="pay-h" className="mb-3 text-base font-bold">{isBuyer ? "Bill details" : "What you earn"}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Items{isBuyer ? "" : " (yours)"}{order.items.some((i) => i.status === "Cancelled") ? <span className="block text-xs">excluding cancelled</span> : null}</dt><dd className="figure font-medium">{formatPrice(order.itemsSubtotal)}</dd></div>
              {isBuyer && (
                <>
                  <div className="flex justify-between"><dt className="text-ink-soft">Delivery (per farm)</dt><dd className="figure font-medium">{formatPrice(order.shippingAmount)}</dd></div>
                  <div className="flex justify-between border-t border-dashed border-rule-strong/60 pt-2.5 text-base font-bold"><dt>Total</dt><dd className="figure">{formatPrice(currentTotal(order))}</dd></div>
                  {currentTotal(order) !== order.totalAmount && <p className="text-xs text-ink-soft"><span className="figure">{formatPrice(order.totalAmount)}</span> originally, before cancelled items.</p>}
                </>
              )}
            </dl>
            <p className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-paper-sunk p-3 text-[13px]">
              <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-field" /> Cash on delivery</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", order.paymentStatus === "Paid" ? "bg-field-wash text-field" : order.paymentStatus === "Cancelled" ? "bg-chili-wash text-chili" : "bg-turmeric-wash text-turmeric-ink")}>{payLabel}</span>
            </p>
          </section>
        </aside>
      </div>

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this item?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="figure">{confirmCancel?.quantity}</span> × {confirmCancel?.productName} will be cancelled and the stock goes back to the farmer. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-chili hover:bg-chili/90" onClick={() => confirmCancel && move.mutate({ item: confirmCancel, status: "Cancelled" })}>Cancel item</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountLayout>
  );
};

export default OrderDetail;
