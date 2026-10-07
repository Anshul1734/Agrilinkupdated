import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardList, IndianRupee, Package, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import { withFallback } from "@/components/ProductCard";
import ProductFormDialog from "@/components/ProductFormDialog";
import StatusBadge from "@/components/StatusBadge";
import FigureStrip from "@/components/FigureStrip";
import { PageMessage, PageSpinner } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { useMyProducts, useOrderStats, useRecentOrders, type FarmerStats } from "@/lib/queries";
import { itemsSummary } from "@/lib/orders";
import { PLACEHOLDER_IMAGE, formatDate, formatPrice } from "@/lib/format";
import { terrainInfo } from "@/data/terrain";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const LOW_STOCK = 20;

const StockLevel: React.FC<{ p: Product }> = ({ p }) => {
  const sold = p.quantityAvailable === 0;
  const low = !sold && p.quantityAvailable <= LOW_STOCK;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", sold ? "bg-chili-wash text-chili" : low ? "bg-turmeric-wash text-turmeric-ink" : "bg-field-wash text-field")}>
      {sold ? "Out of stock" : low ? "Low stock" : "In stock"}
    </span>
  );
};

const FarmerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const products = useMyProducts(true);
  const recent = useRecentOrders();
  const orderStats = useOrderStats<FarmerStats>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [deleting, setDeleting] = useState<Product | null>(null);

  const inventory = products.data?.items ?? [];
  const orderList = recent.data?.items ?? [];

  // Totals come from the database (over ALL orders). Only the six chart buckets are laid out here.
  const stats = useMemo(() => {
    const byMonth = new Map((orderStats.data?.months ?? []).map((m) => [m.month, m.sales]));
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, k) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - k), 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      return { label: d.toLocaleString(undefined, { month: "short", timeZone: "UTC" }), sales: Math.round((byMonth.get(key) ?? 0) * 100) / 100 };
    });
    return { revenue: orderStats.data?.revenue ?? 0, openItems: orderStats.data?.openItems ?? 0, months };
  }, [orderStats.data]);

  const lowStock = inventory.filter((p) => p.quantityAvailable <= LOW_STOCK).length;
  const hasSales = stats.months.some((m) => m.sales > 0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
  const onError = (title: string) => (err: unknown) =>
    toast({ title, description: err instanceof ApiError ? err.message : "Please try again.", variant: "destructive" });

  const updateStock = useMutation({
    mutationFn: ({ id, quantityAvailable }: { id: number; quantityAvailable: number }) => api.put(`/products/${id}/stock`, { quantityAvailable }),
    onSuccess: () => { refresh(); setStockFor(null); toast({ title: "Stock updated" }); },
    onError: onError("Couldn't update stock"),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => { refresh(); setDeleting(null); toast({ title: "Listing removed" }); },
    onError: onError("Couldn't remove the listing"),
  });

  const stockNumber = Number(stockValue);
  const stockValid = stockValue !== "" && Number.isInteger(stockNumber) && stockNumber >= 0 && stockNumber <= 1_000_000;
  const crops = terrainInfo(profile?.terrain);
  const openAdd = () => { setEditing(null); setFormOpen(true); };

  return (
    <AccountLayout
      title={profile?.name ? `${profile.name.split(" ")[0]}'s farm` : "My farm"}
      subtitle="What's listed, what needs restocking, and which orders are waiting on you."
      crumbs={[{ label: "My farm" }]}
      actions={<Button onClick={openAdd}><Plus /> Add product</Button>}
    >
      <FigureStrip
        figures={[
          { label: "Open order items", value: stats.openItems, hint: stats.openItems ? "Waiting on you or in transit" : "Nothing waiting", alert: stats.openItems > 0, icon: <ClipboardList className="h-5 w-5" /> },
          { label: "Active listings", value: inventory.length, hint: `${inventory.filter((p) => p.quantityAvailable > 0).length} in stock`, icon: <Package className="h-5 w-5" /> },
          { label: "Need restocking", value: lowStock, hint: `${LOW_STOCK} units or fewer`, alert: lowStock > 0, icon: <TriangleAlert className="h-5 w-5" /> },
          { label: "Earned", value: formatPrice(stats.revenue), hint: "From delivered items", icon: <IndianRupee className="h-5 w-5" /> },
        ]}
      />

      <div className="mt-4 grid gap-4 2xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <section className="panel" aria-labelledby="orders-h">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <h2 id="orders-h" className="text-base font-bold">Latest orders</h2>
              {orderList.length > 0 && <Link to="/orders" className="text-sm font-semibold text-field hover:underline">View all</Link>}
            </div>
            {recent.isLoading ? (
              <PageSpinner />
            ) : orderList.length === 0 ? (
              <PageMessage plate="ledger" title="No orders yet" description="The moment someone buys from you, it shows up here and you get a notification." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Items</TableHead>
                      <TableHead className="text-right">Yours</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderList.slice(0, 5).map((o) => (
                      <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/order/${o.id}`)}>
                        <TableCell className="figure font-bold">#{o.id}</TableCell>
                        <TableCell>{o.buyerName}</TableCell>
                        <TableCell className="hidden max-w-[14rem] truncate text-ink-soft md:table-cell">{itemsSummary(o.items)}</TableCell>
                        <TableCell className="figure text-right font-semibold">{formatPrice(o.itemsSubtotal)}</TableCell>
                        <TableCell className="figure hidden whitespace-nowrap text-ink-soft md:table-cell">{formatDate(o.created_at)}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="inventory-h">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <h2 id="inventory-h" className="text-base font-bold">Your products</h2>
              {inventory.length > 0 && <Button variant="outline" size="sm" onClick={openAdd}><Plus /> Add product</Button>}
            </div>
            {products.isLoading ? (
              <PageSpinner />
            ) : inventory.length === 0 ? (
              <PageMessage plate="crate" title="You haven't listed anything yet" description="Add a crop with a photo, a price and how much you have. Buyers can order it straight away." action={{ label: "List your first product", onClick: openAdd }} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl || PLACEHOLDER_IMAGE} alt="" onError={withFallback} className="h-11 w-11 shrink-0 rounded-md border border-rule object-cover" />
                            <div className="min-w-0">
                              <Link to={`/product/${p.id}`} className="block truncate font-semibold hover:text-field hover:underline">{p.name}</Link>
                              <span className="text-xs text-ink-soft">{p.categoryName}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="figure whitespace-nowrap text-right">{formatPrice(p.price)}<span className="text-xs text-ink-soft"> / {p.unit}</span></TableCell>
                        <TableCell className="figure whitespace-nowrap text-right font-semibold">{p.quantityAvailable} <span className="text-xs font-normal text-ink-soft">{p.unit}</span></TableCell>
                        <TableCell className="hidden md:table-cell"><StockLevel p={p} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => { setStockFor(p); setStockValue(String(p.quantityAvailable)); }}>Update stock</Button>
                            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil /></Button>
                            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${p.name}`} className="text-ink-soft hover:bg-chili-wash hover:text-chili" onClick={() => setDeleting(p)}><Trash2 /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-4 md:grid-cols-2 2xl:grid-cols-1">
          <section className="panel p-4" aria-labelledby="sales-h">
            <h2 id="sales-h" className="text-base font-bold">Earnings, last 6 months</h2>
            <p className="mb-3 text-xs text-ink-soft">Cancelled items are excluded.</p>
            {hasSales ? (
              <div className="h-48" role="img" aria-label={`Monthly sales for the last six months: ${stats.months.map((m) => `${m.label} ${formatPrice(m.sales)}`).join(", ")}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.months} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "hsl(var(--rule))" }} tick={{ fontSize: 11, fill: "hsl(var(--ink-soft))" }} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => formatPrice(v)} cursor={{ fill: "hsl(var(--field) / 0.07)" }} contentStyle={{ background: "hsl(var(--ink))", border: 0, borderRadius: 8, color: "#fff", fontSize: 12 }} itemStyle={{ color: "#fff" }} labelStyle={{ display: "none" }} />
                    <Bar dataKey="sales" name="Sales" radius={[4, 4, 0, 0]} animationDuration={600}>
                      {stats.months.map((_, i) => <Cell key={i} fill={i === stats.months.length - 1 ? "hsl(var(--lime))" : "hsl(var(--field))"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-lg bg-paper-sunk p-4 text-sm text-ink-soft">No sales yet. This fills in as orders are delivered.</p>
            )}
          </section>

          {crops && (
            <section className="panel p-4" aria-labelledby="terrain-h">
              <h2 id="terrain-h" className="text-base font-bold">Suggested for {crops.type.toLowerCase()} land</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="eyebrow">Crops that suit it</dt><dd className="mt-0.5">{crops.crops}</dd></div>
                <div><dt className="eyebrow">Good practice</dt><dd className="mt-0.5">{crops.practices}</dd></div>
              </dl>
              <Link to="/resources" className="mt-3 inline-block text-sm font-semibold text-field hover:underline">Farmer resources &amp; schemes</Link>
            </section>
          )}
        </aside>
      </div>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />

      <Dialog open={!!stockFor} onOpenChange={(o) => !o && setStockFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update stock</DialogTitle>
            <DialogDescription>{stockFor?.name}. Enter what you physically have now.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (stockFor && stockValid) updateStock.mutate({ id: stockFor.id, quantityAvailable: stockNumber }); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-qty">Quantity available ({stockFor?.unit})</Label>
              <Input id="stock-qty" type="number" min="0" step="1" inputMode="numeric" autoFocus value={stockValue} onChange={(e) => setStockValue(e.target.value)} className="figure text-lg" aria-invalid={!stockValid && stockValue !== ""} />
              {!stockValid && stockValue !== "" && <p className="text-sm text-chili" role="alert">Enter a whole number, 0 or more.</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStockFor(null)}>Cancel</Button>
              <Button type="submit" disabled={!stockValid || updateStock.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from the market. Past orders keep their record of it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-chili hover:bg-chili/90" onClick={() => deleting && remove.mutate(deleting.id)}>Remove listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountLayout>
  );
};

export default FarmerDashboard;
