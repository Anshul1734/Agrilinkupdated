import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export const config = {
  port: Number(env.PORT) || 5001,
  isProd: env.NODE_ENV === 'production' || Boolean(env.VERCEL),
  supabaseUrl: env.SUPABASE_URL,
  // Service-role key: bypasses RLS, so it must only ever live on the server.
  supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  firebaseProjectId: env.FIREBASE_PROJECT_ID,
  // Comma-separated browser origins allowed to call the API cross-origin.
  // Leave empty when the frontend is served from the same origin (Vercel / Vite proxy).
  corsOrigins: (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  // Charged once per farmer in an order.
  shippingPerFarmer: Number(env.SHIPPING_PER_FARMER ?? env.FLAT_SHIPPING ?? 40),
};

export const missingConfig = [
  ['SUPABASE_URL', config.supabaseUrl],
  ['SUPABASE_SERVICE_ROLE_KEY', config.supabaseServiceKey],
  ['FIREBASE_PROJECT_ID', config.firebaseProjectId],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);
