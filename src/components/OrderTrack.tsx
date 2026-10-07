import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STEPS = ["Pending", "Processing", "Shipped", "Delivered"] as const;
const LABEL: Record<(typeof STEPS)[number], string> = { Pending: "Order placed", Processing: "Accepted", Shipped: "Shipped", Delivered: "Delivered" };

/** A stepper: finished steps are green ticks, the current step is outlined, the rest are empty. Cancelled is a single red line. */
const OrderTrack: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className }) => {
  if (status === "Cancelled") {
    return (
      <div className={cn("flex items-center gap-2 text-sm font-semibold text-chili", className)} role="img" aria-label="Cancelled">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-chili text-white"><X className="h-3 w-3" strokeWidth={3} /></span>
        Cancelled
      </div>
    );
  }
  const at = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className={cn("flex items-start", className)} aria-label={`Progress: ${LABEL[STEPS[at]]}`}>
      {STEPS.map((s, i) => {
        const done = i < at || status === "Delivered";
        const current = i === at && status !== "Delivered";
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center" aria-current={current ? "step" : undefined}>
            {i > 0 && <span className={cn("absolute right-1/2 top-[9px] h-0.5 w-full", i <= at ? "bg-field" : "bg-rule")} aria-hidden="true" />}
            <span className={cn("relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-paper-raised", done ? "border-field bg-field text-white" : current ? "border-field" : "border-rule")}>
              {done ? <Check className="h-3 w-3" strokeWidth={3.5} /> : current ? <span className="h-2 w-2 rounded-full bg-field" /> : null}
            </span>
            <span className={cn("mt-1.5 text-[11px] leading-tight", current || done ? "font-semibold text-ink" : "text-ink-soft")}>{LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTrack;
