import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Download, Search } from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import StatusBadge from "@/components/StatusBadge";
import { PageMessage, PageSpinner } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/lib/queries";
import { amountFor, isOpen, ordersToCsv, sellerNames } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/data/catalog";
import { cn } from "@/lib/utils";

const Orders: React.FC = () => {
  const { profile } = useAuth();
  const { data, isLoading, isError, refetch } = useOrders();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [tab, setTab] = useState("all");

  const role = profile?.role ?? "Buyer";
  const isFarmer = role === "Farmer";

  const counts = useMemo(() => {
    const all = data?.items ?? [];
    return { all: all.length, open: all.filter((o) => isOpen(o.status)).length, done: all.filter((o) => o.status === "Delivered").length };
  }, [data]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.items ?? []).filter((o) => {
      if (tab === "open" && !isOpen(o.status)) return false;
      if (tab === "done" && o.status !== "Delivered") return false;
      if (status !== "all" && o.status !== status) return false;
      if (!needle) return true;
      const haystack = [String(o.id), o.buyerName, sellerNames(o), ...o.items.map((i) => i.productName)].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [data, search, status, tab]);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([ordersToCsv(visible, role)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrilink-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountLayout
      title={isFarmer ? "Sales orders" : "My Orders"}
      subtitle={isFarmer ? "Orders that include your products. You see and manage only your own items." : "Track, review or cancel items from your orders."}
      actions={<Button variant="outline" size="sm" onClick={exportCsv} disabled={!visible.length}><Download /> Export CSV</Button>}
    >
      <div className="panel mb-4 flex flex-wrap items-center gap-3 p-3">
        <div role="group" aria-label="Show orders" className="flex gap-1 rounded-lg bg-paper-sunk p-1">
          {([["all", "All", counts.all], ["open", "In progress", counts.open], ["done", "Delivered", counts.done]] as const).map(([value, label, n]) => (
            <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={cn("rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors", tab === value ? "bg-paper-raised text-field shadow-sm" : "text-ink-soft hover:text-ink")}>
              {label} <span className="figure ml-0.5 text-xs">{n}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input aria-label="Search orders" placeholder={isFarmer ? "Search by order, customer or product" : "Search by order, seller or product"} className="h-9 w-full rounded-md border border-input bg-paper-raised pl-9 pr-3 text-sm placeholder:text-ink-soft/70 hover:border-ink/50 focus:border-field focus:outline-none focus:ring-2 focus:ring-field/20" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">Any status</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <div className="panel"><PageMessage plate="gate" title="Orders didn't load" action={{ label: "Try again", onClick: () => refetch() }} /></div>
      ) : visible.length === 0 ? (
        <div className="panel">
          <PageMessage
            plate={data?.items.length ? "search" : "ledger"}
            title={data?.items.length ? "No orders match" : "No orders yet"}
            description={data?.items.length ? "Try a different filter or search." : isFarmer ? "When someone buys your products, the order shows up here and you'll be notified." : "Looks like you haven't ordered anything yet."}
            action={!data?.items.length && !isFarmer ? { label: "Start shopping", to: "/products" } : undefined}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => (
            <li key={o.id} className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule bg-paper-sunk/60 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
                  <p><span className="text-ink-soft">Order </span><span className="figure font-bold">#{o.id}</span></p>
                  <p><span className="text-ink-soft">Placed </span><span className="figure font-medium">{formatDate(o.created_at)}</span></p>
                  <p className="text-ink-soft">{isFarmer ? "Customer " : "From "}<span className="font-medium text-ink">{isFarmer ? o.buyerName : sellerNames(o)}</span></p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                <ul className="min-w-0 flex-1 space-y-1 text-sm">
                  {o.items.slice(0, 3).map((i) => (
                    <li key={i.id} className="flex items-baseline justify-between gap-4">
                      <span className={cn("truncate", i.status === "Cancelled" && "text-ink-soft line-through")}>{i.productName}</span>
                      <span className="figure shrink-0 text-xs text-ink-soft">{i.quantity}{i.unit ? ` ${i.unit}` : ""}</span>
                    </li>
                  ))}
                  {o.items.length > 3 && <li className="text-xs text-ink-soft">+ {o.items.length - 3} more items</li>}
                </ul>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-xs text-ink-soft">{isFarmer ? "Your amount" : "Total"}</p>
                    <p className="figure text-lg font-extrabold leading-tight">{formatPrice(amountFor(o, role))}</p>
                  </div>
                  <Button asChild variant="outline"><Link to={`/order/${o.id}`}>View details <ChevronRight /></Link></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
};

export default Orders;
