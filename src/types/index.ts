export type UserType = "Buyer" | "Farmer";

export interface Profile {
  uid: string;
  email: string | null;
  name: string;
  role: UserType;
  contactNumber?: string | null;
  address?: string | null;
  terrain?: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  productCount: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  quantityAvailable: number;
  inStock: boolean;
  categoryId: number;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  productionType?: string | null;
  imageUrl?: string | null;
  /** Optional list price. When higher than `price`, cards show it struck through with a "% OFF" tag. */
  mrp?: number | null;
  /** Average of verified-purchase reviews (0 when there are none). */
  rating: number;
  reviews: number;
  created_at: string;
}

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  unit?: string | null;
  unitPrice: number;
  quantity: number;
  sellerId: string;
  sellerName?: string | null;
  status: OrderStatus;
}

export interface Order {
  id: number;
  created_at: string;
  buyerId: string;
  buyerName: string;
  shippingAddress?: string | null;
  contactNumber?: string | null;
  shippingAmount: number;
  totalAmount: number;
  /** Subtotal of the (non-cancelled) lines visible to the caller. */
  itemsSubtotal: number;
  status: OrderStatus;
  /** Cash on delivery is the only method today. */
  paymentMethod: "COD";
  /** Due until every live line is delivered, then Paid. Cancelled when nothing is left to pay for. */
  paymentStatus: "Due" | "Paid" | "Cancelled";
  items: OrderItem[];
}

export interface Review {
  id: number;
  productId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface MyReview extends Review {
  productName: string;
  productImage: string | null;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
}
