import type { Order, OrderItem, OrderStatus } from "@/types";

/** Mirrors the transition rules enforced in SQL (update_order_item_status). The server is the authority. */
export function allowedMoves(status: OrderStatus, role: "seller" | "buyer"): OrderStatus[] {
  if (role === "buyer") return status === "Pending" ? ["Cancelled"] : [];
  switch (status) {
    case "Pending": return ["Processing", "Cancelled"];
    case "Processing": return ["Shipped", "Cancelled"];
    case "Shipped": return ["Delivered"];
    default: return [];
  }
}

export const MOVE_LABEL: Partial<Record<OrderStatus, string>> = {
  Processing: "Accept",
  Shipped: "Mark shipped",
  Delivered: "Mark delivered",
  Cancelled: "Cancel",
};

export const isOpen = (s: OrderStatus) => s === "Pending" || s === "Processing" || s === "Shipped";

export const itemsSummary = (items: OrderItem[]) => {
  if (!items.length) return "—";
  const first = `${items[0].productName} × ${items[0].quantity}`;
  return items.length > 1 ? `${first} +${items.length - 1} more` : first;
};

export const sellerNames = (order: Order) => [...new Set(order.items.map((i) => i.sellerName).filter(Boolean))].join(", ") || "—";

/** What the buyer currently owes: live (non-cancelled) lines plus shipping; nothing once everything is cancelled. */
export const currentTotal = (order: Order) =>
  order.items.some((i) => i.status !== "Cancelled") ? order.itemsSubtotal + order.shippingAmount : 0;

/** Amount shown per viewer: buyers see their current total, farmers only their share. */
export const amountFor = (order: Order, role: "Farmer" | "Buyer") => (role === "Farmer" ? order.itemsSubtotal : currentTotal(order));

const csvCell = (v: string | number) => {
  let s = String(v);
  // Neutralise spreadsheet formulas (CSV injection) in user-controlled text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export function ordersToCsv(orders: Order[], role: "Farmer" | "Buyer"): string {
  const header = ["Order", "Date", role === "Farmer" ? "Customer" : "Seller(s)", "Items", "Amount", "Status"];
  const rows = orders.map((o) => [
    o.id,
    new Date(o.created_at).toISOString().slice(0, 10),
    role === "Farmer" ? o.buyerName : sellerNames(o),
    o.items.map((i) => `${i.productName} x${i.quantity}`).join("; "),
    amountFor(o, role).toFixed(2),
    o.status,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}
