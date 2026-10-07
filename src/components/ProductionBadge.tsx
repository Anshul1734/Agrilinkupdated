import React from "react";
import { BadgeCheck, Leaf, Trees, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  Organic: { icon: Leaf, className: "bg-field-wash text-field" },
  Traditional: { icon: Wheat, className: "bg-turmeric-wash text-turmeric-ink" },
  Hybrid: { icon: BadgeCheck, className: "bg-indigo-wash text-indigo" },
  Wild: { icon: Trees, className: "bg-paper-sunk text-ink" },
};

const ProductionBadge: React.FC<{ type?: string | null; className?: string }> = ({ type, className }) => {
  if (!type) return null;
  const { icon: Icon, className: tone } = STYLES[type] ?? STYLES.Traditional;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tone, className)}>
      <Icon className="h-3 w-3" />
      {type}
    </span>
  );
};

export default ProductionBadge;
