import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppNotification, Category, MyReview, Order, Paged, Product, Review } from "@/types";

export type ProductFilters = {
  q?: string;
  categoryIds?: string;
  productionType?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  limit?: number;
  offset?: number;
  ids?: string;
  sellerId?: string;
};

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories"), staleTime: 60_000 });

export const useProducts = (filters: ProductFilters = {}, enabled = true) =>
  useQuery({
    queryKey: ["products", filters],
    queryFn: () => api.get<Paged<Product>>("/products", filters),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useProduct = (id: string | undefined) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: !!id,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });

export const useMyProducts = (enabled: boolean) =>
  useQuery({ queryKey: ["my-products"], queryFn: () => api.get<Paged<Product>>("/products/mine"), enabled });

const ORDER_PAGE = 100;
const ORDER_CAP = 1000;

/** Every order of the caller, fetched page by page (the API caps a page at 100), up to ORDER_CAP. */
async function fetchAllOrders(): Promise<Paged<Order>> {
  const items: Order[] = [];
  let total = 0;
  for (let offset = 0; offset < ORDER_CAP; offset += ORDER_PAGE) {
    const page = await api.get<Paged<Order>>("/orders", { limit: ORDER_PAGE, offset });
    total = page.total;
    items.push(...page.items);
    if (items.length >= total || page.items.length < ORDER_PAGE) break;
  }
  return { items, total };
}

export const useOrders = (enabled = true) => useQuery({ queryKey: ["orders", "all"], queryFn: fetchAllOrders, enabled });

/** The latest few orders, for dashboards. */
export const useRecentOrders = (enabled = true) =>
  useQuery({ queryKey: ["orders", "recent"], queryFn: () => api.get<Paged<Order>>("/orders", { limit: 5 }), enabled });

export interface FarmerStats {
  orders: number;
  openItems: number;
  revenue: number;
  months: { month: string; sales: number }[];
}
export interface BuyerStats {
  orders: number;
  inProgress: number;
  delivered: number;
  spent: number;
}

/** Totals over ALL of the caller's orders, computed in the database. */
export const useOrderStats = <T extends FarmerStats | BuyerStats>(enabled = true) =>
  useQuery({ queryKey: ["orders", "stats"], queryFn: () => api.get<T>("/orders/stats"), enabled });

export const useOrder = (id: string | undefined) =>
  useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });

export const useReviews = (productId: number | undefined, limit: number) =>
  useQuery({
    queryKey: ["reviews", productId, limit],
    queryFn: () => api.get<Paged<Review>>("/reviews", { productId, limit }),
    enabled: !!productId,
    placeholderData: keepPreviousData,
  });

/** Delivered lines of this product the signed-in buyer hasn't reviewed yet. */
export const useEligibleReviews = (productId: number | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ["reviews-eligible", productId],
    queryFn: () => api.get<{ items: { orderItemId: number; orderId: number }[] }>("/reviews/eligible", { productId }),
    enabled: enabled && !!productId,
  });

export const useMyReviews = () => useQuery({ queryKey: ["my-reviews"], queryFn: () => api.get<{ items: MyReview[] }>("/reviews/mine") });

export const useNotifications = (enabled: boolean) =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ items: AppNotification[]; unread: number }>("/notifications"),
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
