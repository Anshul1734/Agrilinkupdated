import React from "react";
import { Link } from "react-router-dom";
import { Apple, Beef, Carrot, Droplets, Egg, Leaf, Milk, Nut, Utensils, Wheat } from "lucide-react";
import { PageMessage, PageSpinner, SectionHead, ViewAll } from "@/components/PageState";
import { useCategories } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

// Icon + pastel tint per category name; anything new falls back to a leaf so nothing renders blank.
export const CATEGORY_STYLE: Record<string, { icon: React.ElementType; tint: string }> = {
  Vegetables: { icon: Carrot, tint: "bg-[#e4f3d3] text-[#3c7a14]" },
  Fruits: { icon: Apple, tint: "bg-[#fde0dd] text-[#c0392b]" },
  Dairy: { icon: Milk, tint: "bg-[#dcebfb] text-[#2f6db5]" },
  Grains: { icon: Wheat, tint: "bg-[#fbeacc] text-[#a86a0c]" },
  Meat: { icon: Beef, tint: "bg-[#f9dcd3] text-[#9c3d22]" },
  Honey: { icon: Droplets, tint: "bg-[#fff0b8] text-[#a3760a]" },
  Eggs: { icon: Egg, tint: "bg-[#fdebd5] text-[#b5651d]" },
  Herbs: { icon: Leaf, tint: "bg-[#d9f2e3] text-[#1d7a4a]" },
  Nuts: { icon: Nut, tint: "bg-[#f1e3d3] text-[#7a5230]" },
  Oils: { icon: Utensils, tint: "bg-[#f6f0b8] text-[#80780d]" },
};
const FALLBACK = { icon: Leaf, tint: "bg-field-wash text-field" };
export const categoryStyle = (name: string) => CATEGORY_STYLE[name] ?? FALLBACK;

/** One category tile: a tinted disc with its icon, then the name and how many listings it has. */
export const CategoryTile: React.FC<{ category: Category; showDescription?: boolean }> = ({ category, showDescription }) => {
  const { icon: Icon, tint } = categoryStyle(category.name);
  return (
    <Link to={`/category/${category.id}`} className="group flex h-full flex-col items-center rounded-lg border border-rule bg-paper-raised p-4 text-center transition-shadow hover:shadow-lg">
      <span className={cn("flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:scale-105 md:h-24 md:w-24", tint)}>
        <Icon className="h-9 w-9 md:h-11 md:w-11" strokeWidth={1.6} />
      </span>
      <span className="mt-3 text-sm font-bold group-hover:text-field">{category.name}</span>
      {showDescription && <span className="mt-1 line-clamp-2 text-xs text-ink-soft">{category.description}</span>}
      <span className="figure mt-1 text-xs text-ink-soft">{category.productCount} {category.productCount === 1 ? "product" : "products"}</span>
    </Link>
  );
};

const CategorySection: React.FC = () => {
  const { data: categories = [], isLoading, isError } = useCategories();

  return (
    <section className="container mt-8" aria-labelledby="shop-by-cat">
      <SectionHead title="Shop by Category" className="mb-4">
        <ViewAll to="/categories" />
      </SectionHead>
      <span id="shop-by-cat" className="sr-only">Shop by Category</span>
      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <PageMessage plate="gate" title="Categories didn't load" description="Please refresh the page to try again." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {categories.map((c) => (
            <CategoryTile key={c.id} category={c} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CategorySection;
