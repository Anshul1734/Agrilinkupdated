import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { SectionHead, ViewAll } from "@/components/PageState";
import { useProducts, type ProductFilters } from "@/lib/queries";

/** A titled, horizontally scrolling row of product cards with "View all" and arrow buttons. Hides itself when empty. */
const ProductRail: React.FC<{ title: string; to: string; filters: ProductFilters; id: string; excludeId?: number }> = ({ title, to, filters, id, excludeId }) => {
  const { data, isLoading, isError } = useProducts(filters);
  const track = useRef<HTMLUListElement>(null);
  const items = (data?.items ?? []).filter((p) => p.id !== excludeId);

  if (!isLoading && (isError || items.length === 0)) return null;

  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="container mt-8" aria-labelledby={id}>
      <div className="panel p-4 md:p-5">
        <SectionHead title={title} className="mb-4 [&_h2]:text-lg md:[&_h2]:text-xl">
          <div className="flex items-center gap-3">
            <ViewAll to={to} />
            <div className="hidden gap-1.5 md:flex">
              <button onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="flex h-8 w-8 items-center justify-center rounded-full border border-input hover:bg-paper-sunk"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="flex h-8 w-8 items-center justify-center rounded-full border border-input hover:bg-paper-sunk"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </SectionHead>
        <span id={id} className="sr-only">{title}</span>
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-72 w-44 shrink-0 animate-pulse rounded-lg bg-paper-sunk md:w-48" />)}
          </div>
        ) : (
          <ul ref={track} className="scrollbar-none -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
            {items.map((p) => (
              <li key={p.id} className="w-44 shrink-0 snap-start md:w-[12.75rem]">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ProductRail;
