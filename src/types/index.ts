
export type UserType = "Buyer" | "Farmer";

export interface User {
  id: number;
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  userType: UserType;
  registrationDate: string;
  terrain?: string;
  recommendedCrops?: string;
  farmLocation?: string;
  farmSize?: string;
  terrainType?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  farmerId: number;
  farmerName: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  unit: string;
  productionType?: string;
  quantityAvailable?: number;
  categoryName?: string;
  categoryId?: number;
  sellerId?: number;
  sellerName?: string;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  reviewText?: string;
  reviewDate?: string;
}

export interface Order {
  id: number;
  buyerId: number;
  products: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  orderDate: string;
  deliveryDate?: string;
}

export interface Cart {
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
  totalAmount: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
}
