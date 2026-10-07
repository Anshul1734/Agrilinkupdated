import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crumbs, PageMessage, PageSpinner } from "@/components/PageState";
import { categoryStyle } from "@/components/CategorySection";
import { useCategories, useProducts } from "@/lib/queries";
import { cn } from "@/lib/utils";

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const categories = useCategories();
  const category = categories.data?.find((c) => String(c.id) === id);
  const products = useProducts({ categoryIds: id, sort, limit: 100 }, !!category);

  if (categories.isLoading) {
    return <Layout><PageSpinner /></Layout>;
  }
  if (!category) {
    return (
      <Layout>
        <div className="container py-6"><div className="panel"><PageMessage plate="search" title="Category not found" description="It may have been renamed or removed." action={{ label: "See all categories", to: "/categories" }} /></div></div>
      </Layout>
    );
  }

  const items = products.data?.items ?? [];
  const { icon: Icon, tint } = categoryStyle(category.name);

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: "Categories", to: "/categories" }, { label: category.name }]} />

        <div className="panel mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-4">
            <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full", tint)}><Icon className="h-7 w-7" strokeWidth={1.6} /></span>
            <div>
              <h1 className="text-xl font-bold md:text-2xl">{category.name}</h1>
              <p className="text-[13px] text-ink-soft">{category.description} · <span className="figure">{products.data?.total ?? category.productCount}</span> {(products.data?.total ?? category.productCount) === 1 ? "product" : "products"}</p>
            </div>
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-9 w-full sm:w-52" aria-label="Sort products"><SelectValue /></SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <nav aria-label="Other categories" className="scrollbar-none mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.data?.map((c) => (
            <Link key={c.id} to={`/category/${c.id}`} aria-current={c.id === category.id ? "page" : undefined} className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors", c.id === category.id ? "border-field bg-field text-white" : "border-rule bg-paper-raised hover:border-field hover:text-field")}>
              {c.name}
            </Link>
          ))}
        </nav>

        {products.isLoading ? (
          <PageSpinner />
        ) : products.isError ? (
          <div className="panel"><PageMessage plate="gate" title="Products didn't load" action={{ label: "Try again", onClick: () => products.refetch() }} /></div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((product) => <ProductCard key={product.id} product={product} headingLevel={2} />)}
          </div>
        ) : (
          <div className="panel"><PageMessage plate="sprout" title="Nothing here yet" description="No farmer has listed products in this category." action={{ label: "Browse all products", to: "/products" }} /></div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryDetail;
