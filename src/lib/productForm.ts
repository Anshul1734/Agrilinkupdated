import { z } from "zod";
import { PRODUCTION_TYPES, UNITS } from "@/data/catalog";

const isHttps = (v: string) => {
  // Demo mode (VITE_MOCK=true) ships its catalogue photos as local /mock/... files.
  if (import.meta.env.VITE_MOCK === "true" && v.startsWith("/mock/")) return true;
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(100),
  categoryId: z.number({ required_error: "Choose a category", invalid_type_error: "Choose a category" }).int().positive("Choose a category"),
  price: z
    .number({ required_error: "Enter a price", invalid_type_error: "Enter a price" })
    .positive("Price must be above 0")
    .max(1_000_000)
    .refine((v) => Math.round(v * 100) / 100 === v, "Use at most 2 decimal places"),
  quantityAvailable: z
    .number({ required_error: "Enter a quantity", invalid_type_error: "Enter a quantity" })
    .int("Whole units only")
    .min(0, "Can't be negative")
    .max(1_000_000),
  unit: z.enum(UNITS),
  productionType: z.enum(PRODUCTION_TYPES),
  description: z.string().trim().max(1000, "Keep it under 1000 characters"),
  imageUrl: z.string().trim().max(500).refine((v) => v === "" || isHttps(v), "Use a full https:// link"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
