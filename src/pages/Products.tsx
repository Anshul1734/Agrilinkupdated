
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, SortDesc, SortAsc, Search, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Products: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    categoryParam ? [parseInt(categoryParam)] : []
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  useEffect(() => {
    if (productsLoading || categoriesLoading) return;
    let filtered: Product[] = [...allProducts];

    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter((product: Product) => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(lowercaseQuery))
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p: Product) => selectedCategories.includes(p.categoryId));
    }

    // Sort by price
    filtered.sort((a, b) => {
      return sortOrder === "asc" 
        ? a.price - b.price 
        : b.price - a.price;
    });

    setDisplayedProducts(filtered);
  }, [query, selectedCategories, sortOrder, allProducts, productsLoading, categoriesLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set("q", searchQuery);
    } else {
      newParams.delete("q");
    }
    window.location.href = `/products?${newParams.toString()}`;
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery("");
    window.location.href = "/products";
  };

  return (
    <Layout>
      <div className="bg-muted py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">
            Browse our selection of farm-fresh produce directly from local farmers
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters - Mobile Toggle */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              className="w-full flex justify-between items-center"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <span className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </span>
              <span>{filterOpen ? "Hide" : "Show"}</span>
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div className={`${filterOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                {(selectedCategories.length > 0 || searchQuery) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">
                    Clear All
                  </Button>
                )}
              </div>

              {/* Search on mobile */}
              <div className="md:hidden mb-6">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </form>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="space-y-2">
                  {categoriesLoading && <Loader2 className="h-4 w-4 animate-spin text-agrilink-primary" />}
                  {categories.map((category: any) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="h-4 w-4 rounded border-gray-300 text-agrilink-primary focus:ring-agrilink-primary"
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Type */}
              <div className="mt-6">
                <h3 className="font-medium mb-2">Production Type</h3>
                <div className="space-y-2">
                  {["Organic", "Traditional", "Hybrid"].map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        className="h-4 w-4 rounded border-gray-300 text-agrilink-primary focus:ring-agrilink-primary"
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mt-6">
                <h3 className="font-medium mb-2">Price Range</h3>
                <div className="flex space-x-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    className="w-full"
                  />
                  <span className="text-gray-500 flex items-center">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="w-full"
                  />
                </div>
                <Button className="w-full mt-2 bg-agrilink-primary hover:bg-agrilink-secondary">
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-grow">
            {/* Sort and Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(catId => {
                  const category = categories.find((c: any) => c.id === catId);
                  return category ? (
                    <Badge
                      key={catId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {category.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleCategory(catId)}
                      />
                    </Badge>
                  ) : null;
                })}
                {query && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {query}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={clearFilters}
                    />
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortOrder}
                  className="flex items-center"
                >
                  {sortOrder === "asc" ? (
                    <>
                      <SortAsc className="mr-1 h-4 w-4" /> Price: Low to High
                    </>
                  ) : (
                    <>
                      <SortDesc className="mr-1 h-4 w-4" /> Price: High to Low
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {displayedProducts.length} results
                </span>
              </div>
            </div>

            {/* Results info on mobile */}
            <div className="sm:hidden mb-4">
              <span className="text-sm text-muted-foreground">
                {displayedProducts.length} results
              </span>
            </div>

            {/* Products */}
            {productsLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-agrilink-primary" />
              </div>
            ) : displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border rounded-lg">
                <h3 className="text-xl font-medium mb-2">No Products Found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any products matching your criteria.
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
