
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Leaf, Wheat } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const productionTypeIcon = () => {
    if (!product.productionType) return null;
    
    switch (product.productionType) {
      case "Organic":
        return <Leaf className="h-4 w-4 mr-1 text-green-600" />;
      case "Traditional":
        return <Wheat className="h-4 w-4 mr-1 text-amber-600" />;
      case "Hybrid":
        return <BadgeCheck className="h-4 w-4 mr-1 text-blue-600" />;
      default:
        return null;
    }
  };

  const productionTypeColor = () => {
    if (!product.productionType) return "bg-gray-100 text-gray-800";
    
    switch (product.productionType) {
      case "Organic":
        return "bg-green-100 text-green-800";
      case "Traditional":
        return "bg-amber-100 text-amber-800";
      case "Hybrid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="product-card h-full flex flex-col">
      <Link to={`/product/${product.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={product.imageUrl || "https://via.placeholder.com/300x200"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          {product.productionType && (
            <div className={`absolute top-2 right-2 ${productionTypeColor()} px-2 py-1 rounded-full text-xs font-medium flex items-center`}>
              {productionTypeIcon()}
              {product.productionType}
            </div>
          )}
        </div>
      </Link>
      <CardContent className="pt-4 flex-grow">
        <div className="text-sm text-muted-foreground mb-1">{product.categoryName || product.category}</div>
        <Link to={`/product/${product.id}`} className="hover:underline">
          <h3 className="font-medium text-lg mb-1 line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground ml-1">per unit</span>
          </div>
          <div className="text-sm">
            <span className={`${product.quantityAvailable && product.quantityAvailable > 10 ? "text-green-600" : "text-amber-600"}`}>
              {product.quantityAvailable && product.quantityAvailable > 0 
                ? `${product.quantityAvailable} available` 
                : "Out of stock"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full bg-agrilink-primary hover:bg-agrilink-secondary"
          onClick={() => {
            addToCart(product, 1);
            toast({
              title: "Added to cart",
              description: `${product.name} added to your cart.`
            });
          }}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
