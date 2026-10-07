import React from "react";
import { AlertCircle, Check, Clock, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

/** Status is a pill with an icon and the word, so colour is never the only signal. */
const STYLES: Record<OrderStatus, { className: string; icon: React.ElementType }> = {
  Pending: { className: "bg-turmeric-wash text-turmeric-ink", icon: Clock },
  Processing: { className: "bg-indigo-wash text-indigo", icon: Package },
  Shipped: { className: "bg-indigo-wash text-indigo", icon: Truck },
  Delivered: { className: "bg-field-wash text-field", icon: Check },
  Cancelled: { className: "bg-chili-wash text-chili", icon: AlertCircle },
};

const StatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className }) => {
  const { className: tone, icon: Icon } = STYLES[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tone, className)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      {status}
    </span>
  );
};

export default StatusBadge;
