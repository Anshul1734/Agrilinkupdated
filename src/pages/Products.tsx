import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Crumbs, PageMessage, PageSpinner } from "@/components/PageState";
import { PRODUCTION_TYPES } from "@/data/catalog";
import { useCategories, useProducts, type ProductFilters } from "@/lib/queries";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const SORTS = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
} as const;

const list = (v: string | null, allowed?: readonly string[]) =>
  (v ?? "")
    .split(",")
    .filter((x) => (allowed ? allowed.includes(x) : /^\d+$/.test(x)));
const num = (v: string | null) => (v !== null && v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : undefined);

const Products: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  // The URL is the single source of truth, so filters survive reloads, back/forward and sharing.
  const q = params.get("q") ?? "";
  const categoryIds = list(params.get("category"));
  const types = list(params.get("type"), PRODUCTION_TYPES);
  const minPrice = num(params.get("min"));
  const maxPrice = num(params.get("max"));
  const seller = params.get("seller") ?? undefined;
  const sortParam = params.get("sort") ?? "newest";
  const sort = (sortParam in SORTS ? sortParam : "newest") as keyof typeof SORTS;
  const page = Math.max(1, Math.floor(num(params.get("page")) ?? 1));

  const [minText, setMinText] = useState(minPrice?.toString() ?? "");
  const [maxText, setMaxText] = useState(maxPrice?.toString() ?? "");
  useEffect(() => setMinText(minPrice?.toString() ?? ""), [minPrice]);
  useEffect(() => setMaxText(maxPrice?.toString() ?? ""), [maxPrice]);

  const update = (patch: Record<string, string | undefined>, keepPage = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!keepPage) next.delete("page");
    setParams(next);
  };

  const toggle = (key: "category" | "type", current: string[], value: string) =>
    update({ [key]: (current.includes(value) ? current.filter((x) => x !== value) : [...current, value]).join(",") || undefined });

  const filters: ProductFilters = {
    q: q || undefined,
    categoryIds: categoryIds.join(",") || undefined,
    productionType: types.join(",") || undefined,
    minPrice,
    maxPrice,
    sellerId: seller,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const categories = useCategories();
  const products = useProducts(filters);
  const items = products.data?.items ?? [];
  const total = products.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeCount = (q ? 1 : 0) + categoryIds.length + types.length + (minPrice !== undefined || maxPrice !== undefined ? 1 : 0) + (seller ? 1 : 0);
  const hasFilters = activeCount > 0;
  const clearFilters = () => setParams(new URLSearchParams());

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const lo = num(minText);
    const hi = num(maxText);
    if (lo !== undefined && hi !== undefined && lo > hi) {
      update({ min: String(hi), max: String(lo) }); // swap rather than show an empty list
      return;
    }
    update({ min: lo?.toString(), max: hi?.toString() });
  };

  const checkbox = (id: string, label: string, checked: boolean, onChange: () => void, count?: number) => (
    <div className="flex items-center gap-3" key={id}>
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between py-1.5 text-[13.5px] font-normal">
        <span>{label}</span>
        {count !== undefined && <span className="figure text-xs text-ink-soft">({count})</span>}
      </Label>
    </div>
  );

  // The same controls render in the desktop sidebar and the phone bottom sheet.
  const filterControls = (
    <div className="divide-y divide-rule">
      <fieldset className="pb-4">
        <legend className="mb-2 text-sm font-bold">Category</legend>
        <div>{categories.data?.map((c) => checkbox(`cat-${c.id}`, c.name, categoryIds.includes(String(c.id)), () => toggle("category", categoryIds, String(c.id)), c.productCount))}</div>
      </fieldset>

      <fieldset className="py-4">
        <legend className="mb-2 text-sm font-bold">How it's grown</legend>
        <div>{PRODUCTION_TYPES.map((t) => checkbox(`type-${t}`, t, types.includes(t), () => toggle("type", types, t)))}</div>
      </fieldset>

      <form onSubmit={applyPrice} className="pt-4">
        <h3 className="mb-3 text-sm font-bold">Price (₹ per unit)</h3>
        <div className="flex items-center gap-2">
          <Input type="number" min="0" step="any" inputMode="decimal" aria-label="Minimum price" placeholder="Min" value={minText} onChange={(e) => setMinText(e.target.value)} className="figure h-9" />
          <span className="text-ink-soft" aria-hidden="true">–</span>
          <Input type="number" min="0" step="any" inputMode="decimal" aria-label="Maximum price" placeholder="Max" value={maxText} onChange={(e) => setMaxText(e.target.value)} className="figure h-9" />
        </div>
        <Button type="submit" variant="outline" size="sm" className="mt-3 w-full">Apply</Button>
      </form>
    </div>
  );

  const sorter = (
    <Select value={sort} onValueChange={(v) => update({ sort: v === "newest" ? undefined : v })}>
      <SelectTrigger className="h-9 w-full min-w-[11rem] sm:w-48" aria-label="Sort products"><SelectValue /></SelectTrigger>
      <SelectContent align="end">
        {Object.entries(SORTS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const heading = q ? `Results for “${q}”` : categoryIds.length === 1 ? (categories.data?.find((c) => String(c.id) === categoryIds[0])?.name ?? "Products") : "All products";

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: heading }]} />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <aside className="panel hidden w-60 shrink-0 p-4 lg:sticky lg:top-[calc(var(--header-h)+3.5rem)] lg:block" aria-label="Filters">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              {hasFilters && <button onClick={clearFilters} className="text-[13px] font-semibold text-field hover:underline">Clear all</button>}
            </div>
            {filterControls}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="panel mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <h1 className="text-lg font-bold md:text-xl">{heading}</h1>
                <p className="text-[13px] text-ink-soft" aria-live="polite">
                  {products.data ? <>Showing <span className="figure font-semibold text-ink">{total}</span> {total === 1 ? "product" : "products"}</> : " "}
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Button variant="outline" size="sm" className="h-9 flex-1 lg:hidden" onClick={() => setFilterOpen(true)}>
                  <SlidersHorizontal /> Filters{activeCount > 0 && <span className="figure rounded-full bg-field px-1.5 text-[11px] text-white">{activeCount}</span>}
                </Button>
                <div className="flex-1 sm:flex-none">{sorter}</div>
              </div>
            </div>

            {hasFilters && (
              <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
                {q && <Tag label={`“${q}”`} onRemove={() => update({ q: undefined })} />}
                {seller && <Tag label={`Seller: ${items[0]?.sellerName ?? "selected"}`} onRemove={() => update({ seller: undefined })} />}
                {categoryIds.map((id) => <Tag key={id} label={categories.data?.find((c) => String(c.id) === id)?.name ?? "Category"} onRemove={() => toggle("category", categoryIds, id)} />)}
                {types.map((t) => <Tag key={t} label={t} onRemove={() => toggle("type", types, t)} />)}
                {(minPrice !== undefined || maxPrice !== undefined) && <Tag label={`₹${minPrice ?? 0} – ${maxPrice !== undefined ? `₹${maxPrice}` : "any"}`} onRemove={() => update({ min: undefined, max: undefined })} />}
              </ul>
            )}

            {products.isLoading ? (
              <PageSpinner />
            ) : products.isError ? (
              <div className="panel"><PageMessage plate="gate" title="Products didn't load" description="Something went wrong fetching the products." action={{ label: "Try again", onClick: () => products.refetch() }} /></div>
            ) : items.length > 0 ? (
              <>
                <div className={cn("grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 md:gap-4 xl:grid-cols-4", products.isPlaceholderData && "opacity-50")}>
                  {items.map((product) => <ProductCard key={product.id} product={product} headingLevel={2} />)}
                </div>
                {pageCount > 1 && (
                  <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                    <Button variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, true)}>Previous</Button>
                    <span className="figure px-3 text-sm text-ink-soft">Page {page} of {pageCount}</span>
                    <Button variant="outline" disabled={page >= pageCount} onClick={() => update({ page: String(page + 1) }, true)}>Next</Button>
                  </nav>
                )}
              </>
            ) : (
              <div className="panel">
                <PageMessage
                  plate="search"
                  title="No products found"
                  description={hasFilters ? "Try removing a filter or searching for something else." : "Nothing has been listed yet. Check back soon."}
                  action={hasFilters ? { label: "Clear all filters", onClick: clearFilters } : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-lg">Filters</SheetTitle>
            <SheetDescription className="sr-only">Filter products by category, how they're grown and price.</SheetDescription>
          </SheetHeader>
          {filterControls}
          <SheetFooter className="mt-5 flex-row gap-2 sm:space-x-0">
            {hasFilters && <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear all</Button>}
            <Button className="flex-1" onClick={() => setFilterOpen(false)}>Show {total} {total === 1 ? "product" : "products"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

const Tag: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <li>
    <button onClick={onRemove} aria-label={`Remove filter ${label}`} className="group inline-flex items-center gap-1.5 rounded-full border border-field/40 bg-field-wash py-1 pl-3 pr-2 text-[13px] font-medium text-field hover:border-field">
      {label}
      <X className="h-3.5 w-3.5" />
    </button>
  </li>
);

export default Products;
