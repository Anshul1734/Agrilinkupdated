import { z } from 'zod';

export const UNITS = ['kg', 'g', 'quintal', 'liter', 'dozen', 'piece', 'jar', 'bunch', 'bag'];
export const PRODUCTION_TYPES = ['Organic', 'Traditional', 'Hybrid', 'Wild'];
export const TERRAINS = ['Plain', 'Hills', 'Drylands', 'Wetlands', 'Mountainous', 'Coastal'];
export const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const money = z.number().positive().max(1_000_000).multipleOf(0.01);
const httpsUrl = z
  .string()
  .max(500)
  .url()
  .refine((u) => u.startsWith('https://'), 'Image URL must start with https://');

// Optional text fields accept '' so a form can clear them.
const optionalText = (max) => z.string().trim().max(max).optional();

const productFields = z.object({
  name: z.string().trim().min(2).max(100),
  description: optionalText(1000),
  categoryId: z.number().int().positive(),
  price: money,
  quantityAvailable: z.number().int().min(0).max(1_000_000),
  unit: z.enum(UNITS),
  productionType: z.enum(PRODUCTION_TYPES),
  imageUrl: z.union([httpsUrl, z.literal('')]).optional(),
});

export const productCreate = productFields;
export const productUpdate = productFields.partial().refine((o) => Object.keys(o).length > 0, 'Nothing to update');
export const stockUpdate = productFields.pick({ quantityAvailable: true });

export const productQuery = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  // comma separated lists
  categoryIds: z.string().regex(/^\d+(,\d+){0,19}$/).optional(),
  ids: z.string().regex(/^\d+(,\d+){0,49}$/).optional(),
  productionType: z.string().optional(),
  sellerId: z.string().trim().min(1).max(128).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  limit: z.coerce.number().int().min(1).max(100).default(48),
  offset: z.coerce.number().int().min(0).default(0),
});

export const orderCreate = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(50),
});

export const contactCreate = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10, 'Please write a little more').max(2000),
  // Honeypot: real users never see or fill this; bots do.
  website: z.string().max(200).optional(),
});

export const reviewCreate = z.object({
  orderItemId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(''),
});

export const reviewQuery = z.object({
  productId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const orderItemStatus = z.object({ status: z.enum(ORDER_STATUSES) });

export const profileCreate = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.enum(['Buyer', 'Farmer']),
  contactNumber: optionalText(30),
  address: optionalText(200),
  terrain: z.enum(TERRAINS).optional(),
});

export const profileUpdate = profileCreate.omit({ role: true }).partial();

/** Parse or throw a 400 with a readable message. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');
    const err = new Error(path ? `${path}: ${issue.message}` : issue.message);
    err.status = 400;
    err.code = 'bad_request';
    throw err;
  }
  return result.data;
}
