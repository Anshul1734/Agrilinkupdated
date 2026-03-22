import { Category, Product, Review } from "@/types";

// Categories
export const categories: Category[] = [
  { id: 1, name: "Vegetables", description: "Fresh vegetables from local farms", imageUrl: "/images/categories/vegetables.jpg", productCount: 15 },
  { id: 2, name: "Fruits", description: "Seasonal and exotic fruits", imageUrl: "/images/categories/fruits.jpg", productCount: 12 },
  { id: 3, name: "Dairy", description: "Fresh milk, cheese, and other dairy products", imageUrl: "/images/categories/dairy.jpg", productCount: 8 },
  { id: 4, name: "Grains", description: "Whole grains and cereals", imageUrl: "/images/categories/grains.jpg", productCount: 10 },
  { id: 5, name: "Meat", description: "Farm-raised meats", imageUrl: "/images/categories/meat.jpg", productCount: 6 },
  { id: 6, name: "Honey", description: "Pure and raw honey varieties", imageUrl: "/images/categories/honey.jpg", productCount: 4 },
  { id: 7, name: "Eggs", description: "Farm-fresh eggs", imageUrl: "/images/categories/eggs.jpg", productCount: 3 },
  { id: 8, name: "Herbs", description: "Fresh and dried herbs", imageUrl: "/images/categories/herbs.jpg", productCount: 9 },
  { id: 9, name: "Nuts", description: "Variety of nuts and seeds", imageUrl: "/images/categories/nuts.jpg", productCount: 7 },
  { id: 10, name: "Oils", description: "Cold-pressed and natural oils", imageUrl: "/images/categories/oils.jpg", productCount: 5 }
];

// Products
export const products: Product[] = [
  {
    id: 1,
    name: "Organic Tomatoes",
    description: "Fresh, locally grown organic tomatoes. Perfect for salads and cooking.",
    categoryId: 1,
    categoryName: "Vegetables",
    price: 2.99,
    quantityAvailable: 50,
    sellerId: 1,
    sellerName: "Green Valley Farm",
    productionType: "Organic",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    farmerId: 1,
    farmerName: "Green Valley Farm",
    category: "Vegetables",
    rating: 4.5,
    reviews: 12,
    inStock: true,
    unit: "kg"
  },
  {
    id: 2,
    name: "Fresh Apples",
    description: "Crisp and juicy apples picked at peak ripeness.",
    categoryId: 2,
    categoryName: "Fruits",
    price: 1.99,
    quantityAvailable: 100,
    sellerId: 2,
    sellerName: "Sunny Orchard",
    productionType: "Traditional",
    imageUrl: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    farmerId: 2,
    farmerName: "Sunny Orchard",
    category: "Fruits",
    rating: 4.8,
    reviews: 24,
    inStock: true,
    unit: "kg"
  },
  {
    id: 3,
    name: "Pure Honey",
    description: "Raw, unfiltered honey straight from the beehive.",
    categoryId: 6,
    categoryName: "Honey",
    price: 7.50,
    quantityAvailable: 30,
    sellerId: 3,
    sellerName: "Bee Haven Apiary",
    productionType: "Organic",
    imageUrl: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1122&q=80",
    farmerId: 3,
    farmerName: "Bee Haven Apiary",
    category: "Honey",
    rating: 4.9,
    reviews: 18,
    inStock: true,
    unit: "jar"
  },
  {
    id: 4,
    name: "Fresh Milk",
    description: "Whole milk from grass-fed cows, pasteurized but not homogenized.",
    categoryId: 3,
    categoryName: "Dairy",
    price: 3.50,
    quantityAvailable: 25,
    sellerId: 4,
    sellerName: "Green Pastures Dairy",
    productionType: "Traditional",
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80",
    farmerId: 4,
    farmerName: "Green Pastures Dairy",
    category: "Dairy",
    rating: 4.7,
    reviews: 15,
    inStock: true,
    unit: "liter"
  },
  {
    id: 5,
    name: "Farm Fresh Eggs",
    description: "Free-range eggs from chickens raised on natural feed.",
    categoryId: 7,
    categoryName: "Eggs",
    price: 4.99,
    quantityAvailable: 40,
    sellerId: 5,
    sellerName: "Happy Hen Farm",
    productionType: "Organic",
    imageUrl: "https://images.unsplash.com/photo-1598965675045-45c7be16be44?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    farmerId: 5,
    farmerName: "Happy Hen Farm",
    category: "Eggs",
    rating: 4.6,
    reviews: 20,
    inStock: true,
    unit: "dozen"
  },
  {
    id: 6,
    name: "Organic Potatoes",
    description: "Versatile, all-purpose potatoes grown without pesticides.",
    categoryId: 1,
    categoryName: "Vegetables",
    price: 2.49,
    quantityAvailable: 75,
    sellerId: 1,
    sellerName: "Green Valley Farm",
    productionType: "Organic",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    farmerId: 1,
    farmerName: "Green Valley Farm",
    category: "Vegetables",
    rating: 4.4,
    reviews: 10,
    inStock: true,
    unit: "kg"
  },
  {
    id: 7,
    name: "Wild Mushrooms",
    description: "Locally foraged seasonal mushrooms.",
    categoryId: 1,
    categoryName: "Vegetables",
    price: 8.99,
    quantityAvailable: 15,
    sellerId: 6,
    sellerName: "Forest Bounty",
    productionType: "Wild",
    imageUrl: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80",
    farmerId: 6,
    farmerName: "Forest Bounty",
    category: "Vegetables",
    rating: 4.3,
    reviews: 7,
    inStock: true,
    unit: "kg"
  },
  {
    id: 8,
    name: "Whole Wheat Flour",
    description: "Stone-ground wheat flour with all the natural nutrients preserved.",
    categoryId: 4,
    categoryName: "Grains",
    price: 3.99,
    quantityAvailable: 60,
    sellerId: 7,
    sellerName: "Heritage Mills",
    productionType: "Traditional",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80",
    farmerId: 7,
    farmerName: "Heritage Mills",
    category: "Grains",
    rating: 4.5,
    reviews: 14,
    inStock: true,
    unit: "kg"
  }
];

// Reviews
export const reviews: Review[] = [
  {
    id: 1,
    userId: 101,
    userName: "Emily Johnson",
    productId: 1,
    rating: 5,
    reviewText: "These tomatoes are incredibly fresh and flavorful! I've been making amazing salads with them.",
    reviewDate: "2025-03-15",
    comment: "These tomatoes are incredibly fresh and flavorful! I've been making amazing salads with them.",
    date: "2025-03-15"
  },
  {
    id: 2,
    userId: 102,
    userName: "Michael Smith",
    productId: 1,
    rating: 4,
    reviewText: "Good quality tomatoes, arrived in perfect condition. Would buy again.",
    reviewDate: "2025-03-10",
    comment: "Good quality tomatoes, arrived in perfect condition. Would buy again.",
    date: "2025-03-10"
  },
  {
    id: 3,
    userId: 103,
    userName: "Jessica Brown",
    productId: 2,
    rating: 5,
    reviewText: "The apples are crisp, juicy, and very sweet. My kids love them!",
    reviewDate: "2025-03-12",
    comment: "The apples are crisp, juicy, and very sweet. My kids love them!",
    date: "2025-03-12"
  },
  {
    id: 4,
    userId: 104,
    userName: "David Wilson",
    productId: 3,
    rating: 5,
    reviewText: "Best honey I've ever tasted! You can definitely tell it's pure and raw.",
    reviewDate: "2025-03-08",
    comment: "Best honey I've ever tasted! You can definitely tell it's pure and raw.",
    date: "2025-03-08"
  },
  {
    id: 5,
    userId: 105,
    userName: "Sarah Davis",
    productId: 5,
    rating: 4,
    reviewText: "These eggs have the brightest yolks I've ever seen. You can taste the difference from store-bought!",
    reviewDate: "2025-03-05",
    comment: "These eggs have the brightest yolks I've ever seen. You can taste the difference from store-bought!",
    date: "2025-03-05"
  }
];

// Featured Products
export const featuredProducts = products.slice(0, 4);

// Current User (mock)
export const currentUser = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  role: "farmer"
};

// Helper Functions
export const getProductById = (id: number) => {
  return products.find(product => product.id === id);
};

export const getProductsByCategory = (categoryId: number) => {
  return products.filter(product => product.categoryId === categoryId);
};

export const getReviewsForProduct = (productId: number) => {
  return reviews.filter(review => review.productId === productId);
};

export const searchProducts = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.categoryName.toLowerCase().includes(lowercaseQuery)
  );
};
