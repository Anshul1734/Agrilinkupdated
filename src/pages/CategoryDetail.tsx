
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, SortAsc, SortDesc } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Category, Product } from "@/types";
import { useToast } from "@/components/ui/use-toast";

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = parseInt(id || "0");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const { data: category = null, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/categories');
      if (!res.ok) throw new Error('Failed to fetch');
      const cats = await res.json();
      return cats.find((c: any) => c.id === categoryId) || null;
    },
    enabled: !!categoryId
  });

  const { data: rawProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', { category: categoryId }],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/products?categoryId=${categoryId}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    enabled: !!categoryId
  });

  const isLoading = categoryLoading || productsLoading;

  // Derive sorted products internally
  const sortedProducts = [...rawProducts].sort((a: any, b: any) => {
    return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
  });

  const sortProducts = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    
    toast({
      title: "Products sorted",
      description: `Products are now sorted by price (${newOrder === "asc" ? "lowest to highest" : "highest to lowest"}).`
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-sm mb-6 text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
        </Link>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : category ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-muted-foreground">
                Showing {sortedProducts.length} products
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={sortProducts}>
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-2" />
                  )}
                  Price {sortOrder === "asc" ? "Low to High" : "High to Low"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Filters", description: "Advanced filters coming soon!" })}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  We currently don't have any products in this category.
                </p>
                <Button asChild>
                  <Link to="/products">Browse all products</Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The category you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/">Go back to home</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryDetail;
