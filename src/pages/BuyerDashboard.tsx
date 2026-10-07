import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, ClipboardList, IndianRupee, Truck } from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import StatusBadge from "@/components/StatusBadge";
import FigureStrip from "@/components/FigureStrip";
import { PageMessage, PageSpinner } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useOrderStats, useRecentOrders, type BuyerStats } from "@/lib/queries";
import { currentTotal, itemsSummary, sellerNames } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";

const BuyerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useRecentOrders();
  const statsQuery = useOrderStats<BuyerStats>();
  const orders = data?.items ?? [];
  const totals = statsQuery.data;
  const dash = (v: React.ReactNode) => (statsQuery.isLoading ? "–" : v);

  return (
    <AccountLayout
      title={`Hello, ${profile?.name?.split(" ")[0] ?? "there"}`}
      subtitle="Here's where your orders stand."
      crumbs={[{ label: "Overview" }]}
      actions={
        <div className="flex gap-2">
          {cartCount > 0 && <Button variant="outline" asChild><Link to="/cart">My Basket ({cartCount})</Link></Button>}
          <Button asChild><Link to="/products">Continue shopping</Link></Button>
        </div>
      }
    >
      <FigureStrip
        figures={[
          { label: "Orders placed", value: dash(totals?.orders ?? 0), icon: <ClipboardList className="h-5 w-5" /> },
          { label: "On the way", value: dash(totals?.inProgress ?? 0), hint: "Not yet delivered", alert: (totals?.inProgress ?? 0) > 0, icon: <Truck className="h-5 w-5" /> },
          { label: "Delivered", value: dash(totals?.delivered ?? 0), icon: <CircleCheck className="h-5 w-5" /> },
          { label: "Total spent", value: dash(formatPrice(totals?.spent ?? 0)), hint: "Delivered orders", icon: <IndianRupee className="h-5 w-5" /> },
        ]}
      />

      <section className="panel mt-4" aria-labelledby="recent-h">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2 id="recent-h" className="text-base font-bold">Recent orders</h2>
          {(totals?.orders ?? 0) > orders.length && <Link to="/orders" className="text-sm font-semibold text-field hover:underline">View all {totals?.orders}</Link>}
        </div>
        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <PageMessage plate="gate" title="Your orders didn't load" action={{ label: "Try again", onClick: () => refetch() }} />
        ) : orders.length === 0 ? (
          <PageMessage plate="basket" title="No orders yet" description="Your first order will show up here with live tracking for every item." action={{ label: "Start shopping", to: "/products" }} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Order</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead><TableHead>From</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/order/${o.id}`)}>
                    <TableCell className="figure font-bold">#{o.id}</TableCell>
                    <TableCell className="figure whitespace-nowrap text-ink-soft">{formatDate(o.created_at)}</TableCell>
                    <TableCell className="max-w-[14rem] truncate">{itemsSummary(o.items)}</TableCell>
                    <TableCell className="max-w-[9rem] truncate text-ink-soft">{sellerNames(o)}</TableCell>
                    <TableCell className="figure text-right font-semibold">{formatPrice(currentTotal(o))}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </AccountLayout>
  );
};

export default BuyerDashboard;
