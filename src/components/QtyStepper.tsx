import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Disables the plus button (stock reached). */
  atMax?: boolean;
  /** Disables the minus button. Left enabled when decreasing removes the line. */
  atMin?: boolean;
  label: string;
  tone?: "red" | "green" | "plain";
  size?: "sm" | "md";
  className?: string;
}

/** − 2 +  Used on product cards (red, once added), the product page and the basket. */
const QtyStepper: React.FC<Props> = ({ value, onDecrease, onIncrease, atMax, atMin, label, tone = "red", size = "md", className }) => {
  const btn = cn(
    "flex shrink-0 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "h-9 w-9" : "h-10 w-10",
    tone === "plain" ? "hover:bg-paper-sunk" : "hover:bg-black/10",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center overflow-hidden rounded-md",
        tone === "red" && "bg-chili text-white",
        tone === "green" && "bg-field text-white",
        tone === "plain" && "border border-input bg-paper-raised text-ink",
        className,
      )}
    >
      <button type="button" className={btn} onClick={onDecrease} disabled={atMin} aria-label={`Decrease quantity of ${label}`}>
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className={cn("figure min-w-8 px-1 text-center text-sm font-bold", tone === "plain" && "min-w-10")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={onIncrease} disabled={atMax} aria-label={`Increase quantity of ${label}`}>
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default QtyStepper;
