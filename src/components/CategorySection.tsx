
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Carrot, Apple, Wheat, Milk, Egg, Fish, Leaf, Flower, Nut, Coffee, Flower2, Droplets, Utensils, Salad, Cherry, Beef, Cookie, Banana, Candy, Sandwich, Loader2 } from "lucide-react";

const CategorySection: React.FC = () => {
  // Map of category names to their respective icons with expanded categories
  const categoryIcons: Record<string, React.ReactNode> = {
    "Vegetables": <Carrot className="h-6 w-6" />,
    "Fruits": <Apple className="h-6 w-6" />,
    "Grains": <Wheat className="h-6 w-6" />,
    "Dairy": <Milk className="h-6 w-6" />,
    "Poultry": <Egg className="h-6 w-6" />,
    "Seafood": <Fish className="h-6 w-6" />,
    "Herbs": <Leaf className="h-6 w-6" />,
    "Spices": <Flower className="h-6 w-6" />,
    "Nuts": <Nut className="h-6 w-6" />,
    "Beverages": <Coffee className="h-6 w-6" />,
    "Flowers": <Flower2 className="h-6 w-6" />,
    "Honey": <Droplets className="h-6 w-6" />, // Changed from Drop to Droplets
    "Oil": <Utensils className="h-6 w-6" />,
    "Tea": <Leaf className="h-6 w-6" />, // Changed from Cup to Leaf
    "Coffee": <Coffee className="h-6 w-6" />,
    "Meat": <Beef className="h-6 w-6" />,
    "Bakery": <Cookie className="h-6 w-6" />,
    "Snacks": <Banana className="h-6 w-6" />,
    "Sweets": <Candy className="h-6 w-6" />,
    "Condiments": <Sandwich className="h-6 w-6" />
  };

  // Enhanced color palette for categories based on product types
  const categoryColors: Record<string, string> = {
    "Vegetables": "bg-green-100 text-green-700",
    "Fruits": "bg-red-100 text-red-700",
    "Grains": "bg-amber-100 text-amber-700",
    "Dairy": "bg-blue-100 text-blue-700",
    "Poultry": "bg-orange-100 text-orange-700",
    "Seafood": "bg-cyan-100 text-cyan-700",
    "Herbs": "bg-emerald-100 text-emerald-700",
    "Spices": "bg-yellow-100 text-yellow-700",
    "Nuts": "bg-amber-100 text-amber-800",
    "Beverages": "bg-purple-100 text-purple-700",
    "Flowers": "bg-pink-100 text-pink-700",
    "Honey": "bg-amber-100 text-amber-600",
    "Oil": "bg-yellow-50 text-yellow-800",
    "Tea": "bg-green-50 text-green-800",
    "Coffee": "bg-brown-100 text-brown-700",
    "Meat": "bg-red-50 text-red-800",
    "Bakery": "bg-orange-50 text-orange-800",
    "Snacks": "bg-lime-100 text-lime-700",
    "Sweets": "bg-pink-50 text-pink-800",
    "Condiments": "bg-red-100 text-red-600"
  };

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  return (
    <section className="py-12 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover a wide range of farm-fresh products across different categories directly from local farmers. 
            Our marketplace connects you with premium agricultural products from sustainable sources.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-agrilink-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category: any) => (
              <Link key={category.id} to={`/category/${category.id}`}>
                <Card className="hover:shadow-md transition-all h-full hover:scale-105 duration-200">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${categoryColors[category.name] || "bg-gray-100 text-gray-700"}`}>
                      {categoryIcons[category.name] || <div className="h-6 w-6 bg-gray-300 rounded-full"></div>}
                    </div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Not finding what you're looking for? <Link to="/products" className="text-primary font-medium hover:underline">Browse all products</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
