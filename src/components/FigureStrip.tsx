import React from "react";
import { cn } from "@/lib/utils";

export interface Figure {
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** Marks a figure that needs action (e.g. order items waiting on the farmer). */
  alert?: boolean;
  icon?: React.ReactNode;
}

/** A row of headline-number cards, as on a seller or account dashboard. */
const FigureStrip: React.FC<{ figures: Figure[]; className?: string }> = ({ figures, className }) => (
  <dl className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4", className)}>
    {figures.map((f) => (
      <div key={f.label} className={cn("panel flex items-start justify-between gap-3 p-4", f.alert && "border-turmeric/60 bg-turmeric-wash/40")}>
        <div className="min-w-0">
          <dt className="text-[13px] font-medium text-ink-soft">{f.label}</dt>
          <dd className="figure mt-1 truncate text-xl sm:text-[1.625rem] font-bold leading-tight">{f.value}</dd>
          {f.hint && <p className="mt-0.5 text-xs text-ink-soft">{f.hint}</p>}
        </div>
        {f.icon && <span className={cn("hidden h-10 w-10 shrink-0 items-center sm:flex justify-center rounded-full", f.alert ? "bg-turmeric/25 text-turmeric-ink" : "bg-field-wash text-field")}>{f.icon}</span>}
      </div>
    ))}
  </dl>
);

export default FigureStrip;
