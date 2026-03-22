
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, Wheat, BadgeCheck, Star, Minus, Plus, Truck, ShieldCheck, RefreshCcw } from "lucide-react";
import Layout from "@/components/Layout";
import { Product, Review } from "@/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: product = null, isLoading: loading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`http://localhost:5000/api/products/${id}`);
      if (!res.ok) {
        if (res.status === 406 || res.status === 404) return null;
        throw new Error('Failed to fetch product');
      }
      return res.json();
    },
    enabled: !!id
  });

  const reviews: Review[] = []; // Reviews disabled pending unified backend

  const renderProductionIcon = () => {
    if (!product) return null;

    switch (product.productionType) {
      case "Organic":
        return <Leaf className="h-5 w-5 mr-1 text-green-600" />;
      case "Traditional":
        return <Wheat className="h-5 w-5 mr-1 text-amber-600" />;
      case "Hybrid":
        return <BadgeCheck className="h-5 w-5 mr-1 text-blue-600" />;
      default:
        return null;
    }
  };

  const renderProductionLabel = () => {
    if (!product) return null;

    const colorMap = {
      "Organic": "bg-green-100 text-green-800 border-green-200",
      "Traditional": "bg-amber-100 text-amber-800 border-amber-200",
      "Hybrid": "bg-blue-100 text-blue-800 border-blue-200"
    };

    return (
      <div className={`flex items-center px-3 py-1 rounded-full text-sm ${colorMap[product.productionType]} border`}>
        {renderProductionIcon()}
        {product.productionType}
      </div>
    );
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    if (product && quantity < product.quantityAvailable) {
      setQuantity(quantity + 1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-200 rounded-lg h-96"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-1/3 mt-6"></div>
                <div className="h-12 bg-gray-200 rounded mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <a href="/products">Browse All Products</a>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <a href="/" className="text-gray-500 hover:text-agrilink-primary">Home</a>
              <span className="mx-2 text-gray-500">/</span>
            </li>
            <li className="flex items-center">
              <a href="/products" className="text-gray-500 hover:text-agrilink-primary">Products</a>
              <span className="mx-2 text-gray-500">/</span>
            </li>
            <li className="flex items-center">
              <a href={`/category/${product.categoryId}`} className="text-gray-500 hover:text-agrilink-primary">
                {product.categoryName}
              </a>
              <span className="mx-2 text-gray-500">/</span>
            </li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <img
              src={product.imageUrl || "https://via.placeholder.com/600x400"}
              alt={product.name}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <div className="flex mr-2">
                  {renderStars(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0)}
                </div>
                <span className="text-gray-600">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
              {renderProductionLabel()}
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold mb-2">${product.price.toFixed(2)}</p>
              <p className={`text-sm ${product.quantityAvailable > 10 ? "text-green-600" : "text-amber-600"}`}>
                {product.quantityAvailable > 0 
                  ? `${product.quantityAvailable} units available` 
                  : "Out of stock"}
              </p>
            </div>

            <div className="border-t border-b py-6 mb-6">
              <p className="text-gray-700 mb-4">{product.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <Truck className="h-6 w-6 text-agrilink-primary mb-2" />
                  <span className="text-sm text-center">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <ShieldCheck className="h-6 w-6 text-agrilink-primary mb-2" />
                  <span className="text-sm text-center">Quality Guaranteed</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <RefreshCcw className="h-6 w-6 text-agrilink-primary mb-2" />
                  <span className="text-sm text-center">Easy Returns</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={handleQuantityDecrease}
                      className="px-3 py-1 border-r disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="w-12 text-center py-1"
                    />
                    <button
                      onClick={handleQuantityIncrease}
                      className="px-3 py-1 border-l disabled:opacity-50"
                      disabled={quantity >= product.quantityAvailable}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total</label>
                  <p className="font-bold">${(product.price * quantity).toFixed(2)}</p>
                </div>
              </div>
              <Button 
                className="w-full bg-agrilink-primary hover:bg-agrilink-secondary"
                onClick={() => {
                  addToCart(product, quantity);
                  toast({
                    title: "Added to cart",
                    description: `${quantity}x ${product.name} added to your cart.`
                  });
                }}
              >
                Add to Cart
              </Button>
            </div>

            <div className="mt-8">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Seller:</span>
                <a href={`/farmer/${product.sellerId}`} className="text-agrilink-primary hover:underline">
                  {product.sellerName}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="mr-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {review.userName?.substring(0, 1) || "U"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.reviewText}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
