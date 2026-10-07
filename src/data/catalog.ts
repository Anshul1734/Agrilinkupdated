// Keep in sync with backend/lib/schemas.ts
export const UNITS = ["kg", "g", "quintal", "liter", "dozen", "piece", "jar", "bunch", "bag"] as const;
export const PRODUCTION_TYPES = ["Organic", "Traditional", "Hybrid", "Wild"] as const;
export const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
