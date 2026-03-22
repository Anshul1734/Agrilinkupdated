
import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Mock reviews data
const myReviews = [
  {
    id: 1,
    productId: 1,
    productName: "Tomatoes",
    rating: 5,
    reviewText: "Great tomatoes! They taste just like the ones my grandmother used to grow.",
    reviewDate: "2023-03-05"
  },
  {
    id: 2,
    productId: 2,
    productName: "Apples",
    rating: 4,
    reviewText: "Apples were fresh and juicy. Will buy again!",
    reviewDate: "2023-04-15"
  },
  {
    id: 11,
    productId: 21,
    productName: "Quinoa",
    rating: 4,
    reviewText: "Good quality quinoa, cooks well and tastes great!",
    reviewDate: "2024-01-10"
  },
  {
    id: 12,
    productId: 22,
    productName: "Mangoes",
    rating: 5,
    reviewText: "Best mangoes ever! So sweet and juicy.",
    reviewDate: "2024-02-15"
  }
];

const MyReviews: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star 
        key={index}
        className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
      />
    ));
  };
  
  const filteredReviews = searchTerm.trim() === "" 
    ? myReviews 
    : myReviews.filter(review => 
        review.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        review.reviewText.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="p-0 hover:bg-transparent"
              onClick={() => navigate('/buyer-dashboard')}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
            <h1 className="text-3xl font-bold text-agrilink-primary">My Reviews</h1>
          </div>
        </div>
        
        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search reviews by product or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {filteredReviews.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-600">No reviews found matching your search.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredReviews.map(review => (
              <Card key={review.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{review.productName}</CardTitle>
                      <CardDescription>Reviewed on {review.reviewDate}</CardDescription>
                    </div>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{review.reviewText}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyReviews;
