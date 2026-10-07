import React from "react";
import Layout from "@/components/Layout";
import { Crumbs, PageMessage, PageSpinner } from "@/components/PageState";
import { CategoryTile } from "@/components/CategorySection";
import { useCategories } from "@/lib/queries";

const Categories: React.FC = () => {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: "All categories" }]} />
        <div className="panel p-4 md:p-6">
          <h1 className="text-xl font-bold md:text-2xl">Shop by Category</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Counts show products currently in stock.</p>
          {isLoading ? (
            <PageSpinner />
          ) : isError ? (
            <PageMessage plate="gate" title="Categories didn't load" action={{ label: "Try again", onClick: () => refetch() }} />
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
              {categories.map((c) => <CategoryTile key={c.id} category={c} showDescription />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
