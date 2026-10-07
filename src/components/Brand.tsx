import React from "react";
import { cn } from "@/lib/utils";

/** The mark: a sprout in a lime disc. Simple enough to hold up at 16px (favicon) and 40px (header). */
export const Mark: React.FC<{ className?: string; inverted?: boolean }> = ({ className, inverted }) => (
  <svg viewBox="0 0 32 32" className={cn("h-9 w-9", className)} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill={inverted ? "#fff" : "hsl(var(--lime))"} />
    <path d="M16 25V15" stroke="hsl(var(--field-deep))" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 17.5c-4.6 0-7-2.6-7-6.5 4.6 0 7 2.6 7 6.5z" fill="hsl(var(--field-deep))" />
    <path d="M16 15c0-4 2.4-6.6 7-6.6 0 4-2.4 6.6-7 6.6z" fill="hsl(var(--field))" />
  </svg>
);

export const Wordmark: React.FC<{ className?: string; inverted?: boolean }> = ({ className, inverted }) => (
  <span className={cn("inline-flex items-center gap-2", className)}>
    <Mark inverted={inverted} />
    <span className={cn("text-[1.5rem] font-extrabold leading-none tracking-tight", inverted ? "text-white" : "text-ink")}>
      agri<span className={inverted ? "text-lime" : "text-field"}>link</span>
    </span>
  </span>
);
