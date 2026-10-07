import React from "react";
import ProductRail from "@/components/ProductRail";
import { useCategories } from "@/lib/queries";
import { MOCK_ENABLED } from "@/mocks/api";

/** "Fresh arrivals", then a rail for each of the first few categories with enough listings to fill a row. */
const FeaturedProducts: React.FC = () => {
  const { data: categories = [] } = useCategories();
  const stocked = categories.filter((c) => c.productCount >= 3).slice(0, 3);

  return (
    <>
      {/* The real API cannot rank by popularity yet, so this rail is shown in demo mode only. */}
      {MOCK_ENABLED && <ProductRail id="rail-best" title="Best sellers" to="/products" filters={{ inStock: true, limit: 12, sort: "popular" }} />}
      <ProductRail id="rail-new" title="Fresh arrivals" to="/products" filters={{ inStock: true, limit: 12, sort: "newest" }} />
      {stocked.map((c) => (
        <ProductRail key={c.id} id={`rail-${c.id}`} title={c.name} to={`/category/${c.id}`} filters={{ inStock: true, limit: 12, categoryIds: String(c.id), sort: "newest" }} />
      ))}
    </>
  );
};

export default FeaturedProducts;
