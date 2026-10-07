import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only rating as stars. Fractions are rounded to the nearest whole star. */
export const Stars: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(value) ? "fill-turmeric text-turmeric" : "fill-transparent text-rule-strong")} />
    ))}
  </span>
);

/** Green rating chip with a count, as shown on product cards: "4.6 ★ (12)". */
export const RatingChip: React.FC<{ value: number; count?: number; className?: string }> = ({ value, count, className }) => (
  <span className={cn("inline-flex items-center gap-1", className)}>
    <span className={cn("inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold text-white", value >= 4 ? "bg-field" : value >= 3 ? "bg-turmeric-ink" : "bg-chili")} aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="figure">{value.toFixed(1)}</span>
      <Star className="h-3 w-3 fill-white" aria-hidden="true" />
    </span>
    {count !== undefined && <span className="figure text-xs text-ink-soft">({count})</span>}
  </span>
);

/** Accessible star picker (radio group semantics, arrow keys work natively). */
export const StarInput: React.FC<{ value: number; onChange: (v: number) => void; id?: string }> = ({ value, onChange, id }) => (
  <div role="radiogroup" aria-label="Rating" id={id} className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <label key={i} className="cursor-pointer p-0.5">
        <input type="radio" name={`${id ?? "rating"}`} value={i} checked={value === i} onChange={() => onChange(i)} className="peer sr-only" aria-label={`${i} star${i > 1 ? "s" : ""}`} />
        <Star className={cn("h-8 w-8 transition-transform peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-field hover:scale-110", i <= value ? "fill-turmeric text-turmeric" : "fill-transparent text-rule-strong")} />
      </label>
    ))}
  </div>
);
